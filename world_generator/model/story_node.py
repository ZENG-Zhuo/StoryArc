"""
Story node module for managing branching narrative structures.

This module provides Pydantic models for representing and managing branching story structures,
including nodes, arcs, and transitions between story elements.
"""

from pydantic import BaseModel, Field
from typing import List

class NextNode(BaseModel):
    """Represents a connection to the next story node with a criteriaDescription."""
    criteriaDescription: str
    nodeID: str

class StoryNode(BaseModel):
    """Represents a single node in the story structure."""
    nodeID: str
    storyline: str
    nextNode: List[NextNode]

class StoryArc(BaseModel):
    """Represents a story arc containing multiple story nodes."""
    storyArc: str
    nodes: List[StoryNode]

class StoryStructure(BaseModel):
    """Represents the complete story structure containing multiple story arcs."""
    arcs: List[StoryArc]

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "arcs": [{
                    "storyArc": "rise",
                    "nodes": [{
                        "nodeID": "1.1.1",
                        "storyline": (
                            "Red's mother gives her an important letter "
                            "to deliver to her grandmother and warns her not to talk to strangers."
                        ),
                        "nextNode": [
                            {
                                "criteriaDescription": "Talk to mother",
                                "nodeID": "1.2.1"
                            },
                            {
                                "criteriaDescription": "Pick up knife",
                                "nodeID": "1.2.2"
                            }
                        ]
                    }]
                }]
            }
        }

    @classmethod
    def from_list(cls, data: List[dict]) -> 'StoryStructure':
        """Creates a StoryStructure instance from a list of arc dictionaries."""
        return cls(arcs=[StoryArc(**arc) for arc in data])

    def to_list(self) -> List[dict]:
        """Converts the StoryStructure instance to a list of dictionaries."""
        return [arc.dict() for arc in self.arcs]
