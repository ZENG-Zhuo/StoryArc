"""Graph utility functions for story arc analysis.

This module provides functions for analyzing story arc structures using networkx graph algorithms.
It helps identify isolated nodes and analyze connectivity patterns in story level structures.

Functions:
    find_isolated_nodes: Identifies disconnected nodes in a story level structure
    no_isolated_nodes: Checks if the story structure contains any isolated nodes
"""

from typing import List

import networkx as nx
from world_generator.model.story_node import StoryStructure

'''
TODO:
- Harry's code will have error if I add digraph attribute in StoryGraph.
Otherwise it is better to put the graph construction there.
Let's just do it now. But in the future, always put it to the dataclass
'''
def build_nx_graph(story_struct: StoryStructure) -> nx.DiGraph:
    """Builds a directed graph representation of the story structure."""
    di_graph = nx.DiGraph()
    for level in story_struct.levelList:
        di_graph.add_node(level.levelIndex)
        for next_level in level.nextLevel:
            di_graph.add_edge(level.levelIndex, next_level.index)
    return di_graph

def find_unreachable_nodes(story_struct: StoryStructure) -> List[int]:
    """
    Find nodes in the directed graph that cannot be reached from node 1.

    This method computes the set of all nodes in the graph and compares it 
    with the set of nodes reachable from node 1. The nodes that are not 
    in the reachable set are considered unreachable.

    Returns:
        List[int]: A list of node IDs that cannot be reached from node 1.
    """
    # print(f"Nodes:\n{list(self.di_graph.nodes())}")
    # print(f"Edges:\n{list(self.di_graph.edges())}")
    # Find isolated nodes
    di_graph = build_nx_graph(story_struct=story_struct)
    reachable_nodes = nx.descendants(di_graph, 1) | {1}  # include the root
    all_nodes = set(di_graph.nodes())
    unreachable_nodes = all_nodes - reachable_nodes
    return unreachable_nodes

def no_unreachable_nodes(story_struct: StoryStructure) -> bool:
    """Check if the story structure has any isolated nodes.
    This function uses the `find_isolated_nodes` function to determine if the
    story structure has any isolated nodes.
    Args:
        story_struct (StoryStructure): A collection of story level nodes representing the
            story structure, where each node contains its level index and connections
            to next levels.

    Returns:
        bool: True if the story structure has no isolated nodes, False otherwise.
    """

    return len(find_unreachable_nodes(story_struct)) == 0

def remove_unreachable_nodes(story_struct: StoryStructure) -> StoryStructure:
    """Remove isolated nodes from the story structure.

    This function removes any nodes that have no connections to or from other nodes
    in the story structure and returns a new StoryStructure without those nodes.
    Served as a fallback function

    Returns:
        StoryStructure: A new story structure with isolated nodes removed.

    Example:
        >>> story = StoryStructure([
        ...     LevelNode(levelIndex=1, nextLevel=[NextLevel(index=2)]),
        ...     LevelNode(levelIndex=2, nextLevel=[]),
        ...     LevelNode(levelIndex=3, nextLevel=[]),  # isolated node
        ... ])
        >>> graph = NxStoryDiGraph(story)
        >>> new_story = graph.remove_isolated_nodes()
        >>> len(new_story.levelList)
        2
    """
    unreachable_nodes = find_unreachable_nodes(story_struct)
    # Filter out isolated nodes from the level list
    new_level_list = [
        level for level in story_struct.levelList
        if level.levelIndex not in unreachable_nodes
    ]
    # Return a new StoryStructure with the filtered level list
    return StoryStructure(levelList=new_level_list)
