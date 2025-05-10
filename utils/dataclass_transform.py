from world_generator.model.level import LevelNode
from world_generator.model.entity import LevelEntityNode, EntityModel

def transform_LevelNode_to_LevelEntityNode(level_node: LevelNode, entity: EntityModel)-> LevelEntityNode:
    return LevelEntityNode(**level_node.dict(), entity=entity)
