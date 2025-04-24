"""Story node module for managing branching narrative structures.

This module provides data classes for representing and managing branching story structures,
including nodes, arcs, and transitions between story elements.
"""
from dataclasses import dataclass
from typing import List

@dataclass
class NextNode:
    """Represents a connection to the next story node with a condition.

    Attributes:
        condition (str): The condition that must be met to move to the next node
        to (str): The ID of the next node to transition to
    """
    condition: str
    to: str

@dataclass
class StoryNode:
    """Represents a single node in the story structure.

    Attributes:
        nodeID (str): Unique identifier for the node
        storyline (str): The narrative content of this story node
        nextNode (List[NextNode]): List of possible next nodes and their conditions
    """
    nodeID: str
    storyline: str
    nextNode: List[NextNode]

@dataclass
class StoryArc:
    """Represents a story arc containing multiple story nodes.

    Attributes:
        arc (str): The type of story arc (e.g., "rise", "fall")
        nodes (List[StoryNode]): List of story nodes in this arc
    """
    arc: str
    nodes: List[StoryNode]

@dataclass
class StoryStructure:
    """Represents the complete story structure containing multiple story arcs.

    Attributes:
        arcs (List[StoryArc]): List of story arcs that make up the complete story

    Methods:
        from_dict: Creates a StoryStructure instance from a dictionary
        to_list: Converts the StoryStructure instance to a list of dictionaries
    """
    arcs: List[StoryArc]

    class Config:
        """Configuration class for StoryStructure.

        This class defines configuration settings and schema examples for the StoryStructure class.
        The schema_extra provides an example of the expected data structure for story arcs,
        including nodes and their transitions.
        """
        schema_extra = {
            "example": {
                "arcs": [{
                    "arc": "rise",
                    "nodes": [{
                        "nodeID": "1.1.1",
                        "storyline": "Red's mother gives her an important letter \
                            to deliver to her grandmother \
                            and warns her not to talk to strangers.",
                        "nextNode": [{
                            "condition": "Talk to mother",
                            "to": "1.2.1"
                        }, {
                            "condition": "Pick up knife",
                            "to": "1.2.2"
                        }]
                    }]
                }]
            }
        }

    @classmethod
    def from_dict(cls, data: List[dict]) -> 'StoryStructure':
        """Creates a StoryStructure instance from a dictionary.
        Args:
            data (List[dict]): The dictionary representation of the story structure.
        Returns:
            StoryStructure: The created StoryStructure instance.
        """
        arcs = []
        for arc_data in data:
            nodes = [
                StoryNode(
                    nodeID=node['nodeID'],
                    storyline=node['storyline'],
                    nextNode=[
                        NextNode(
                            condition=nextNode['condition'],
                            to=nextNode['to']
                        )
                        for nextNode in node['nextNode']
                    ]
                )
                for node in arc_data['nodes']
            ]
            arcs.append(StoryArc(arc=arc_data['arc'], nodes=nodes))
        return cls(arcs=arcs)

    def to_list(self) -> List[dict]:
        """Converts the StoryStructure instance to a list of dictionaries.
        Returns:
            List[dict]: The list representation of the story structure.
        """
        return [
            {
                'arc': arc.arc,
                'nodes': [
                    {
                        'nodeID': node.nodeID,
                        'storyline': node.storyline,
                        'nextNode': [
                            {
                                'condition': next_node.condition,
                                'to': next_node.to
                            }
                            for next_node in node.nextNode
                        ]
                    }
                    for node in arc.nodes
                ]
            }
            for arc in self.arcs
        ]
