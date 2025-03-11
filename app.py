from fastapi import FastAPI, HTTPException, Depends, status, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
import os
from datetime import datetime
import anthropic
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Changelog Generator")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup database
SQLALCHEMY_DATABASE_URL = "sqlite:///./changelogs.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Updated Base class for SQLAlchemy 2.0
class Base(DeclarativeBase):
    pass

# Database model
class ChangelogDB(Base):
    __tablename__ = "changelogs"
    
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    raw_git_diff = Column(Text, nullable=True)
    generated_content = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    published = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class ChangelogInput(BaseModel):
    version: str
    title: str
    description: Optional[str] = None
    git_diff: Optional[str] = None

class ChangelogOutput(BaseModel):
    id: int
    version: str
    title: str
    description: Optional[str] = None
    generated_content: str
    created_at: datetime
    published: bool

class ChangelogPublish(BaseModel):
    published: bool

# Initialize AI client
try:
    # Try the simple initialization first (newer versions)
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
except TypeError:
    # Fall back to older version initialization if needed
    client = anthropic.Client(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Generate changelog content using AI
def generate_changelog(input_data: ChangelogInput) -> str:
    prompt = f"""
You are an expert at converting technical changes into clear, user-friendly changelog entries.

Version: {input_data.version}
Title: {input_data.title}
Description: {input_data.description or "No additional description provided"}

"""

    if input_data.git_diff:
        prompt += f"""
Git diff of changes:
```
{input_data.git_diff}
```

Based on this git diff and the information provided, generate a well-formatted, user-friendly changelog entry.
"""
    else:
        prompt += """
Please generate a well-formatted, user-friendly changelog entry based on the information provided.
"""
        
    prompt += """
The changelog should:
1. Be concise yet informative
2. Focus on user-facing changes and benefits
3. Group related changes (features, fixes, improvements)
4. Use Markdown formatting with bullet points
5. Avoid technical jargon where possible
6. Include any breaking changes or deprecations prominently

Format the changelog in Markdown with clear sections.
"""

    try:
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        # Fallback content in case of AI service failure
        print(f"AI generation error: {str(e)}")
        return f"""
# {input_data.title} (v{input_data.version})

{input_data.description or ""}

*Note: AI-generated content failed. This is a placeholder.*
"""

# API routes
@app.post("/api/changelogs/", response_model=ChangelogOutput)
def create_changelog(input_data: ChangelogInput, db: Session = Depends(get_db)):
    print(f"Creating changelog for version: {input_data.version}")
    # Generate changelog content
    generated_content = generate_changelog(input_data)
    
    # Create DB entry
    db_changelog = ChangelogDB(
        version=input_data.version,
        title=input_data.title,
        description=input_data.description,
        raw_git_diff=input_data.git_diff,
        generated_content=generated_content,
        published=False
    )

    db.add(db_changelog)
    print("Committing changelog")
    db.commit()
    print("Refreshing changelog")
    db.refresh(db_changelog)

    return ChangelogOutput(
        id=db_changelog.id,
        version=db_changelog.version,
        title=db_changelog.title,
        description=db_changelog.description,
        generated_content=db_changelog.generated_content,
        created_at=db_changelog.created_at,
        published=db_changelog.published
    )


@app.get("/api/changelogs/", response_model=List[ChangelogOutput])
def list_changelogs(published_only: bool = False, db: Session = Depends(get_db)):
    print("Listing changelogs")
    changelogs = []
    if published_only:
        changelogs = b.query(ChangelogDB).filter(ChangelogDB.published == True).order_by(ChangelogDB.created_at.desc()).all()
    changelogs = db.query(ChangelogDB).order_by(ChangelogDB.created_at.desc()).all()

    return [ChangelogOutput(
        id=changelog.id,
        version=changelog.version,
        title=changelog.title,
        description=changelog.description,
        generated_content=changelog.generated_content,
        created_at=changelog.created_at,
        published=changelog.published
    ) for changelog in changelogs]

@app.get("/api/changelogs/{changelog_id}", response_model=ChangelogOutput)
def get_changelog(changelog_id: int, db: Session = Depends(get_db)):
    print(f"Getting changelog with ID: {changelog_id}")
    changelog = db.query(ChangelogDB).filter(ChangelogDB.id == changelog_id).first()
    if not changelog:
        raise HTTPException(status_code=404, detail="Changelog not found")
    return changelog

@app.patch("/api/changelogs/{changelog_id}/publish", response_model=ChangelogOutput)
def publish_changelog(changelog_id: int, publish_data: ChangelogPublish, db: Session = Depends(get_db)):
    print(f"Publishing changelog with ID: {changelog_id}")
    changelog = db.query(ChangelogDB).filter(ChangelogDB.id == changelog_id).first()
    if not changelog:
        raise HTTPException(status_code=404, detail="Changelog not found")
    
    changelog.published = publish_data.published
    db.commit()
    db.refresh(changelog)
    return changelog

@app.put("/api/changelogs/{changelog_id}", response_model=ChangelogOutput)
def update_changelog(changelog_id: int, input_data: ChangelogInput, db: Session = Depends(get_db)):
    print(f"Updating changelog with ID: {changelog_id}")
    changelog = db.query(ChangelogDB).filter(ChangelogDB.id == changelog_id).first()
    if not changelog:
        raise HTTPException(status_code=404, detail="Changelog not found")
    
    # Update fields
    changelog.version = input_data.version
    changelog.title = input_data.title
    changelog.description = input_data.description
    changelog.raw_git_diff = input_data.git_diff
    
    # Regenerate content
    changelog.generated_content = generate_changelog(input_data)
    
    db.commit()
    db.refresh(changelog)
    return changelog

@app.delete("/api/changelogs/{changelog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_changelog(changelog_id: int, db: Session = Depends(get_db)):
    print(f"Deleting changelog with ID: {changelog_id}")
    changelog = db.query(ChangelogDB).filter(ChangelogDB.id == changelog_id).first()
    if not changelog:
        raise HTTPException(status_code=404, detail="Changelog not found")

    db.delete(changelog)
    db.commit()
    return None

# Run the application
if __name__ == "__main__":
    print("Starting server...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
    print("Server started")
