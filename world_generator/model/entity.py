"""Entity Module

This module contains the data models for all entities in the game world, including:
- Doors: Represent passageways between areas
- Items: Collectible objects with various properties
- Players: The player character's stats
- NPCs: Non-player characters with various attributes
- Levels: Individual game levels containing entities
- Complete Game: Collection of all levels and player data

The models use Pydantic for data validation and serialization.
"""

from typing import List, Optional
from pydantic import BaseModel

from world_generator.model.level import LevelNode

class TileData(BaseModel):
    """A model representing tile color data.
    
    Attributes:
        r (float): Red component (0-1)
        g (float): Green component (0-1)
        b (float): Blue component (0-1)
        a (float): Alpha component (0-1)
    """
    r: float
    g: float
    b: float
    a: float

class DoorModel(BaseModel):
    """A model representing a door in the game world.
    
    Attributes:
        index (int): Unique identifier for the door (-1 means return to menu)
    """
    index: int

class ItemModel(BaseModel):
    """A model representing an item that can be found in the game world.
    
    Attributes:
        itemName (str): Name of the item
        description (str): Detailed description of the item
        pickable (bool): Whether the item can be picked up by the player
        attack (int): Attack bonus provided by the item
        health (int): Health bonus provided by the item
    """
    itemName: str
    description: str
    pickable: bool
    attack: int
    health: int

class PlayerDataModel(BaseModel):
    """A model representing the player's data.
    
    Attributes:
        health (int): Current health points of the player
        attack (int): Base attack power of the player
        description (str): Physical description of the player
    """
    name: str
    health: int
    attack: int
    description: str

class NPCModel(BaseModel):
    """A model representing a non-player character (NPC) in the game.
    
    Attributes:
        NPCName (str): Name of the NPC
        description (str): Physical description of the NPC
        dialogue (List[str]): List of dialogue options
        attack (int): NPC's attack power
        hasRangedAttack (bool): Whether NPC has ranged attack
        health (int): NPC's health points
        friend (bool): Whether the NPC is friendly to the player
        door (Optional[int]): Associated door index if NPC guards/owns a door
    """
    NPCName: str
    description: str
    dialogue: List[str]
    attack: int
    hasRangedAttack: Optional[bool]
    health: int
    friend: bool
    door: Optional[int]

class EntityModel(BaseModel):
    """A model containing all entity-related data for a level.
    
    Attributes:
        tileData (TileData): Color data for the level's tiles
        NPCList (List[NPCModel]): List of NPCs present in the level
        itemList (List[ItemModel]): List of items present in the level
        doorList (List[DoorModel]): List of doors present in the level
    """
    tileData: TileData
    NPCList: List[NPCModel]
    itemList: List[ItemModel]
    doorList: List[DoorModel]

class LevelEntityNode(LevelNode):
    """A model representing a single level in the game.
    
    Attributes:
        storyArc (str): Name of the story arc this level belongs to
        levelIndex (int): Unique identifier for the level
        storyline (str): Description of what happens in this level
        nextLevel (List[nextLevel]): Possible next levels
        entity (EntityModel): Entities present in this level
    """
    entity: EntityModel

class GameStructure(BaseModel):
    """A model representing the complete game structure.
    
    Attributes:
        playerData (PlayerDataModel): Player's initial stats and data
        levelList (List[LevelModel]): List of all levels in the game
    """
    playerData: PlayerDataModel
    levelList: List[LevelEntityNode]
    @classmethod
    def from_dict(cls, data: dict):
        """Create a GameStructure instance from a dictionary."""
        return cls(**data)

    def to_dict(self) -> dict:
        """Convert the GameStructure instance to a dictionary."""
        return self.model_dump()
