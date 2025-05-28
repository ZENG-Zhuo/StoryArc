"""
Story node module for managing branching narrative structures.

This module provides Pydantic models for representing and managing branching story structures,
including nodes, arcs, and transitions between story elements.
"""
from typing import List, Optional
from pydantic import BaseModel
import networkx as nx

from world_generator.model.level import LevelNode

class StoryStructure(BaseModel):
    """Represents the complete story structure containing multiple levels."""
    levelList: List[LevelNode]
    # di_graph: Optional[nx.DiGraph]

    # def build_nx_graph(self) -> None:
    #     """Builds a directed graph representation of the story structure."""
    #     self.di_graph = nx.DiGraph()
    #     for level in self.levelList:
    #         self.di_graph.add_node(level.levelIndex)
    #         for next_level in level.nextLevel:
    #             self.di_graph.add_edge(level.levelIndex, next_level.index)

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "levelList": [
                    {
                        "storyArc": "Rise",
                        "levelIndex": 1,
                        "storyline": "You find yourself at the edge of a dense, foggy forest. An old man leans on a wooden staff near a worn signpost.",
                        "nextLevel": [
                            {
                                "criteriaDescription": "Take the left path",
                                "index": 2
                            },
                            {
                                "criteriaDescription": "Take the right path",
                                "index": 3
                            }
                        ]
                    },
                    {
                        "storyArc": "Rise",
                        "levelIndex": 1,
                        "storyline": "You find yourself at the edge of a dense, foggy forest. An old man leans on a wooden staff near a worn signpost.",
                        "nextLevel": [
                            {
                                "criteriaDescription": "Take the left path",
                                "index": 2
                            },
                            {
                                "criteriaDescription": "Take the right path",
                                "index": 3
                            }
                        ]
                    }
                ]
            }
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'StoryStructure':
        """Creates a StoryStructure instance from a dictionary."""
        return cls(levelList=[LevelNode(**level) for level in data.get('levelList', [])])

    def to_dict(self) -> dict:
        """Converts the StoryStructure instance to a dictionary."""
        return {'levelList': [level.dict() for level in self.levelList]}
