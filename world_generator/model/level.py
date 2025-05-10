"""
Level Module

This module defines the data models for representing story levels and their connections
in a branching narrative structure.

Classes:
    nextLevel: Represents a connection to the next story node with criteria
    LevelNode: Represents a single level/node in the story structure
"""

from typing import List
from pydantic import BaseModel

class NextLevel(BaseModel):
    """Represents a connection to the next story node with a criteriaDescription."""
    criteriaDescription: str
    index: int

class LevelNode(BaseModel):
    """Represents a single level node in the story structure."""
    storyArc: str
    levelIndex: int
    storyline: str
    nextLevel: List[NextLevel]
