'''A module for interacting with the LLM'''

import os
import json
import inspect
from pathlib import Path
from functools import partial
from typing import List

from tqdm import tqdm

# from openai import OpenAI
# from openai.types import OpenAIError,\
#  APIConnectionError, RateLimitError, AuthenticationError, BadRequestError
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
# from langchain_core.messages.chat import ChatMessage
from langchain_core.prompts import ChatPromptTemplate
from portkey_ai import createHeaders


from world_generator.model.story_node import StoryStructure
from world_generator.model.entity import \
    GameStructure,\
    PlayerDataModel,\
    LevelEntityNode,\
    EntityModel,\
    NPCModel,\
    ItemModel,\
    DoorModel
from world_generator.model.level import LevelNode, NextLevel
from utils.parser import parse_to_dataclass
from utils.dataclass_transform import transform_LevelNode_to_LevelEntityNode
from utils.graph import no_unreachable_nodes, remove_unreachable_nodes

load_dotenv()

CURRENT_PROMPT_VERSION = '20250524_1847'

MAX_ATTEMPT = 3 # retry calling LLM if it fails

class Formatter:
    '''A class for formatting the input to the LLM'''

    def _get_formatted_dict(self, content, role):
        '''A method for formatting the input to the LLM'''
        # openAI official
        # res = {
        #     # Available roles are: ["system", "user", "assistant"]
        #     "role": role,
        #     "content": content,
        # }
        # Langchain
        res = (role, content)
        return res

    def ai_msg(self, content):
        '''A method for formatting the AI input to the LLM'''
        return self._get_formatted_dict(content, "assistant")

    def user_msg(self, content):
        '''A method for formatting the user input to the LLM'''
        return self._get_formatted_dict(content, "user")

    def sys_msg(self, content):
        '''A method for formatting the system input to the LLM'''
        return self._get_formatted_dict(content, "system")

class GPTClient:
    '''A class for interacting with the GPT API'''
    def __init__(self):
        self.formatter = Formatter()

        # config = {
        #     "virtual_key": os.getenv('VIRTUAL_KEY')
        # }
        portkey_headers = createHeaders(
            api_key=os.getenv('PORTKEY_API_KEY'),
            virtual_key=os.getenv('VIRTUAL_KEY')
            # config = config 
        )
        self.client = ChatOpenAI(
            base_url=os.getenv('BASE_URL'),
            default_headers=portkey_headers,
            api_key='X',
            # temperature = 1.0,
            max_tokens=6000,
            timeout=90,
            # max_retries=2,
        )

        module_dir = Path(__file__).parent
        # directory to store prompts. Can change this to different versions
        self.prompts_dir = module_dir / 'prompts' / CURRENT_PROMPT_VERSION

        # get chains
        self.story_chain = self._init_chain('gen_story')
        self.entity_chain = self._init_chain('gen_entity')

        # revise each story
        self.revise_story_chain = self._init_chain('revise_each_node')

        # gen each level entity
        self.level_list_chain = self._init_chain('gen_each_level_entity/level_list')
        self.player_data_chain = self._init_chain('gen_each_level_entity/player_data')
        # decide the door for each entity
        self.decide_door_chain = self._init_chain('decide_door')

    def _load_prompt(self, prompt_name):
        '''Load prompt from file'''
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()

    def _init_chain(self, prompt_name, escape_system_prompt_braces=True):
        '''A method for initializing different chains'''
        # TODO:
        # - add system prompt from the prompts folder
        # - verify the response is in JSON
        # return self._single_send(user_prompt, system_prompt)
        system_prompt = self._load_prompt(f'sys/{prompt_name}')
        user_prompt_template = self._load_prompt(f'user/{prompt_name}')
        # print(f"system_prompt is {system_prompt}\n\n===========\n")
        # print(f"user_prompt_template is {user_prompt_template}\n\n===========\n")
        if escape_system_prompt_braces:
            system_prompt = self.escape_curly_braces(system_prompt)
        prompt = ChatPromptTemplate.from_messages([
            self.formatter.sys_msg(system_prompt),
            self.formatter.user_msg(user_prompt_template)
        ])
        chain = prompt | self.client
        # print(chain)
        return chain

    def _process_gpt_request(
        self,
        chain,
        input_data,
        output_dataclass=None,
        verification_func=None,
        fallback_func=None
    ):
        """Generic method to process GPT requests with verification and fallback
        
        Args:
            chain: The LangChain to invoke
            input_data: Dictionary of input parameters for the chain
            output_dataclass: The dataclass to parse the response into
            verification_func: Optional function to verify the parsed response
            fallback_func: Optional function to modify the response if verification fails
            
        Returns:
            Parsed and verified dataclass instance or None if failed
        """
        for _ in range(MAX_ATTEMPT):
            response = chain.invoke(input_data)
            res_content = response.content
            res_content = self.clean_json(res_content)
            # with open("temp_data_ff7_20250528_0044/story_node_together.json", "r", encoding="utf-8") as f:
            #     res_content = json.load(f)
                # story_node = StoryStructure.from_dict(data)
            # print(f"res_content is {res_content}")
            if output_dataclass:
                res_content = parse_to_dataclass(output_dataclass, res_content)

            if res_content:
                # print("entering verification process")
                # If no verification needed or verification passes
                if verification_func is None or verification_func(res_content):
                    # print("verification success")
                    return res_content

                # If verification fails but we have a fallback
                if fallback_func is not None:
                    fallback_args = inspect.signature(fallback_func).parameters
                    if len(fallback_args) == 1:
                        modified_data = fallback_func(res_content)
                    elif len(fallback_args) == 0:
                        modified_data = fallback_func()
                    else:
                        print("fallback function requires more than 1 arguments.")
                        print("return None")
                        return None
                    if verification_func(modified_data):
                        return modified_data
                    print("fallback function failed to modify the response.")
                    print("return None")
                    return None
            print("Something went wrong. Retrying...")

        print("Reaching max attempts.")
        return None

    def gen_story_node(self, story_description, story_arc, num_endings) -> StoryStructure:
        '''A method for generating a story node'''
        story_struct = self.gen_story_struct(story_description, story_arc, num_endings)
        story_list = self.revise_story_node(story_struct)
        return story_list

    def gen_story_struct(self, story_description, story_arc, num_endings) -> StoryStructure:
        '''A method for generating a story node'''

        input_data = {
            "story_description": story_description,
            "story_arc": story_arc,
            "num_endings": num_endings
        }

        return self._process_gpt_request(
            chain=self.story_chain,
            input_data=input_data,
            output_dataclass=StoryStructure,
            verification_func=no_unreachable_nodes,
            fallback_func=remove_unreachable_nodes
        )

    def revise_story_node(self, story_node: StoryStructure) -> StoryStructure | None:
        '''A method for revising a story node. Will make sure it aligns with the story arc'''
        story_node_size = len(story_node.levelList)
        story_list = []

        for i in tqdm(range(story_node_size), desc="Revising each story nodes"):
            current_story_node = story_node.levelList[i]
            # story_list.append(current_story_node)

            # fetch the mind reset sentence
            if current_story_node.storyArc == 'Rise':
                # rise.txt file
                mind_reset_file = 'mind_reset/rise'
            else:
                # fall.txt file
                mind_reset_file = 'mind_reset/fall'
            mind_reset_sentence = self._load_prompt(mind_reset_file)

            # Prepare input data
            story_list_dict = [level.dict() for level in story_list]
            current_story_node_dict = current_story_node.dict()
            input_data = {
                "mind_reset": mind_reset_sentence,
                "story_list": json.dumps(story_list_dict),
                "current_story_node": json.dumps(current_story_node_dict)
            }

            # Process the request
            # print(f"level {i}\ninput_data:\n{input_data}")
            new_story_node = self._process_gpt_request(
                chain=self.revise_story_chain,
                input_data=input_data,
                output_dataclass=LevelNode
            )

            if new_story_node:
                # Transform to LevelEntityNode
                # print(f"new_story_node is:\n{new_story_node}")
                # story_list[i] = new_story_node # replace with the new one
                story_list.append(new_story_node)
            else:
                print(f"Failed to revise the node {i+1}")
                return None
        story_dict = {}
        story_dict["levelList"] = story_list

        res_dataclass = parse_to_dataclass(StoryStructure, story_dict)
        if res_dataclass:
            return res_dataclass
        print("Failed to parse game dictionary to StoryStructure.")
        return None


    def gen_entity(self, story_node: StoryStructure) -> GameStructure:
        '''A method for generating an entity
        The output will be node with entity
        '''
        # TODO:
        # - verify the response is in JSON
        # - handle error
        # handle exception
        story_node_dict = story_node.to_dict()
        story_node_str = json.dumps(story_node_dict)
        for _ in range(MAX_ATTEMPT):
            response = self.entity_chain.invoke({
                "story_node": story_node_str
            })
            res_content = response.content

            # for testing
            # res_content = self.dummy_gen_story_node(story_description, story_arc, num_endings)

            # clean the response
            res_content = self.clean_json(res_content)
            res_dataclass = parse_to_dataclass(GameStructure, res_content)
            if res_dataclass:
                return res_dataclass
            print("Something went wrong. Retrying...")
        print("Reaching max attempts.")
        return None # TODO: handle error

    def gen_player_data(self, story_node: StoryStructure) -> PlayerDataModel | None:
        '''A method for generating player data'''
        story_node_dict = story_node.to_dict()
        story_node_str = json.dumps(story_node_dict)
        for _ in range(MAX_ATTEMPT):
            response = self.player_data_chain.invoke({
                "story_node": story_node_str
            })
            res_content = response.content
            res_content = self.clean_json(res_content)
            res_dataclass = parse_to_dataclass(PlayerDataModel, res_content)
            if res_dataclass:
                return res_dataclass
            print("Something went wrong. Retrying...")
        print("Reaching max attempts.")
        return None

    def verify_doorList_correspondence(
        self,
        new_level_entity: EntityModel,
        current_level: LevelNode
    ) -> bool:
        '''A method for verifying the correspondence between doorList and nextLevel'''
        door_indices = {door.index\
            for door in new_level_entity.doorList}
        next_level_indices = {next_level.index\
            for next_level in current_level.nextLevel}
        if not door_indices.issubset(next_level_indices):
            print(f"Door indices {door_indices}\
                are not within next level indices {next_level_indices}")
            return False
        return True


    def gen_level_list(self, story_node: StoryStructure) -> List[LevelEntityNode] | None:
        '''A method for generating level list'''

        level_size = len(story_node.levelList)
        level_list = []
        # level_dict_list = []
        for i in tqdm(range(level_size), desc="Generating entities for levels"):
            new_level_list = story_node.levelList[i]
            level_list.append(new_level_list)

            level_list_dict = [level.dict() for level in level_list]
            input_data = {
                "level_list": json.dumps(level_list_dict)
            }

            new_level_entity = self._process_gpt_request(
                chain=self.level_list_chain,
                input_data=input_data,
                output_dataclass=EntityModel,
                # will now directly append the doorlist.\
                # so ignore the verification function
                # verification_func=partial(
                #     self.verify_doorList_correspondence,
                #     current_level=level_list[i]
                # ),
            )

            if new_level_entity:
                level_list[i] = transform_LevelNode_to_LevelEntityNode(
                    level_node=level_list[i],
                    entity=new_level_entity
                )
            else:
                print(f"level_list is {level_list}")
                print(f"new_level_entity is {new_level_entity}")
                print("Reaching max attempts.")
                return None

        return level_list

    
        # for i in tqdm(range(level_size), desc="Generating entities for levels"):
        #     new_level_list = story_node.levelList[i]
        #     level_list.append(new_level_list)

        #     legit = False
        #     for _ in range(MAX_ATTEMPT):
        #         level_list_dict = [level.dict() for level in level_list]
        #         response = self.level_list_chain.invoke({
        #             "level_list": json.dumps(level_list_dict)
        #         })
        #         res_content = response.content
        #         # clean the response
        #         res_content = self.clean_json(res_content)
        #         new_level_entity = parse_to_dataclass(EntityModel, res_content)
        #         # verify the doorList and nextLevel correspondence
        #         if new_level_entity:
        #             legit = self.verify_doorList_correspondence(
        #                 new_level_entity=new_level_entity,
        #                 current_level=level_list[i]
        #             )
        #             if legit:
        #                 break
        #             # door_indices = {door.index\
        #             #     for door in new_level_entity.doorList}
        #             # next_level_indices = {next_level.index\
        #             #     for next_level in level_list[i].nextLevel}
        #             # if not door_indices.issubset(next_level_indices):
        #             #     print(f"Door indices {door_indices}\
        #             #         are not within next level indices {next_level_indices}")
        #             # else:
        #             #     legit = True
        #             #     break
        #         print("Something went wrong. Retrying...")
        #     if new_level_entity and not legit:
        #         # rule-based modify the doorList
        #         print("GPT generated doorList verification failed.\
        #             Switch to Rule-based method to modify the doorList.")
        #         for j, door in enumerate(new_level_entity.doorList):
        #             # find the corresponding nextLevel
        #             next_level_index = level_list[i].nextLevel[j].index
        #             door.index = next_level_index
        #         # verify again
        #         # change legit
        #         legit = self.verify_doorList_correspondence(
        #             new_level_entity=new_level_entity,
        #             current_level=level_list[i]
        #         )
        #     if new_level_entity and legit:
        #         # level_list[i] now is a LevelNode. transform it to LevelEntityNode
        #         level_list[i]=transform_LevelNode_to_LevelEntityNode(
        #             level_node=level_list[i],
        #             entity=new_level_entity
        #         )
        #     else:
        #         print(f"level_list is {level_list}")
        #         print(f"new_level_entity is {new_level_entity}")
        #         print("Reaching max attempts.")
        #         return None
        # # verify the response structure
        # return level_list

    def decide_door(
        self,
        level_list: List[LevelEntityNode]
    ) -> None:
        '''
        A method to assign entity to a door. Don't require doorlist,
        since will use nextLevel to decide

        args:
            level_list: List[LevelEntityNode]. With incomplete information.
                will fill it inside this function
        
        return:
            None: the level_list will be modified in place
        '''
        def verify_door_inside_nextLevel(
            new_door: int,
            nextLevel: NextLevel
        ) -> bool:
            '''A method for verifying if new_door is inside nextLevel'''
            door_indices = [int(door.index) for door in nextLevel]
            new_door = int(new_door)
            # print(f"door_indices are {door_indices}")
            # print(f"new_door is {new_door}")
            return new_door in door_indices or new_door == 0

        def assign_no_door():
            '''A method for assigning no door. Fall back function'''
            print("fallback function, assign no door")
            return 0

        def iterate_assign_door(
            npc_item_list: List[NPCModel | ItemModel],
            next_level: List[NextLevel]
        ) -> None:
            '''A method for iterating through NPC list or item list and assigning door'''
            for entity in npc_item_list:
                # assign a door
                # verify the door
                input_data = {
                    "current_entity": entity.dict(),
                    "next_level": [level.dict() for level in next_level],
                }
                # Process the request
                # print(f"level {i}\ninput_data:\n{input_data}")
                door_number = self._process_gpt_request(
                    chain=self.decide_door_chain,
                    input_data=input_data,
                    verification_func=partial(
                        verify_door_inside_nextLevel,
                        nextLevel=next_level
                    ),
                    fallback_func=assign_no_door
                )
                if door_number:
                    # change the door number
                    entity.door = int(door_number)
                else:
                    print(f"Failed to decide the door for entity {entity}")
                    return

        # main function
        level_list_size = len(level_list)

        for i in tqdm(range(level_list_size), desc="Deciding the door of each entity"):
            current_level_ref = level_list[i] # this is a reference to the current story_node.
            # story_list.append(current_story_node)

            current_next_level_ref = current_level_ref.nextLevel
            current_npc_list_ref = current_level_ref.entity.NPCList
            current_item_list_ref = current_level_ref.entity.itemList

            # decide the door for each npc and item
            iterate_assign_door(current_npc_list_ref, current_next_level_ref)
            iterate_assign_door(current_item_list_ref, current_next_level_ref)

    def append_door_list(
        self,
        level_list: List[LevelEntityNode]
    ) -> None:
        '''
        A method for appending doorList to the entity
        Should happen after getting the entity list, I will just append
        Will just do in-place update
        '''
        for level in tqdm(level_list, desc="Appending door list to levels"):
            next_level_ref = level.nextLevel
            next_level_index = [
                next_level.index for next_level in next_level_ref
            ]
            door_mode_list: List[DoorModel] = [
                DoorModel(index=door_index) for door_index in next_level_index
            ]
            level.entity.doorList = door_mode_list

    def gen_entity_stepwise(self, story_node: StoryStructure) -> GameStructure | None:
        '''A method for generating an entity step by step.
        Will generate the player data first, then generate the level list.
        Level list will be generated level by level.
        The output will be node with entity
        '''
        # TODO:
        # - verify the response is in JSON
        # - handle error
        # handle exception
        # story_node_dict = story_node.to_dict()
        game_dict = {
            "playerData": None,
            "levelList": None
        }
        player_data = self.gen_player_data(story_node)
        if not player_data:
            print("Failed to generate player data.")
            return None

        level_list = self.gen_level_list(story_node)
        if not level_list:
            print("Failed to generate level list.")
            return None

        self.decide_door(level_list=level_list)
        self.append_door_list(level_list=level_list)

        game_dict["playerData"] = player_data
        game_dict["levelList"] = level_list

        res_dataclass = parse_to_dataclass(GameStructure, game_dict)
        if res_dataclass:
            return res_dataclass
        print("Failed to parse game dictionary to GameStructure.")
        return None

    def clean_json(self, text: str) -> str:
        '''A method for cleaning the JSON string
        1. gpt might return ```json``` to wrap the json. remove
        '''
        if text.startswith('```'):
            text = text.split('\n', 1)[1]  # Remove first line
        if text.endswith('```'):
            text = text.rsplit('\n', 1)[0]  # Remove last line
        return text

    def escape_curly_braces(self, text: str) -> str:
        '''A method for escaping curly braces. For sys prompts'''
        return text.replace("{", "{{").replace("}", "}}")

    # def dummy_gen_story_node(self, story_description, story_arc, num_endings):
    #     '''A dummy method for generating a story node. For integration testing'''
    #     data = '''
    #         {
    #             "levelList": [
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 1,
    #                     "storyline": "In the neon-lit city of Neo Elysium, towering skyscrapers pierce the skies while magic-infused technology hums softly in the background. You step onto the bustling streets, feeling a surge of energy as you prepare to join the Resistance against the corrupt Corporate Mages.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Talk to the street vendor about the Resistance",
    #                             "index": 2
    #                         },
    #                         {
    #                             "criteriaDescription": "Observe a magical duel between two mages",
    #                             "index": 3
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 2,
    #                     "storyline": "The vendor shares details of a secret meeting tonight where the Resistance plots to steal tech from the Mages. A sense of purpose fills your heart as you consider your next steps.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Join the meeting",
    #                             "index": 4
    #                         },
    #                         {
    #                             "criteriaDescription": "Refuse to attend and explore the city instead",
    #                             "index": 5
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 3,
    #                     "storyline": "As you watch the mages duel, an older woman with a golden aura catches your attention. She raises a finger and summons a luminous creature. There's magic in the air that inspires you.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Approach the woman for guidance",
    #                             "index": 6
    #                         },
    #                         {
    #                             "criteriaDescription": "Leave the area to find the Resistance",
    #                             "index": 5
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 4,
    #                     "storyline": "The meeting is hidden beneath an old railway station, where shadowy figures discuss the heist. Together, you plan the operation to breach the Mages’ vault - success could turn the tide.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Volunteer for a crucial role in the heist",
    #                             "index": 7
    #                         },
    #                         {
    #                             "criteriaDescription": "Stay back and gather intel on the Mages",
    #                             "index": 8
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 5,
    #                     "storyline": "While wandering, a nearby rift suddenly opens and forces magical creatures into the streets. Chaos ensues. With danger all around, your decision to delay joining the Resistance weighs heavily.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Help fend off the magical creatures",
    #                             "index": 9
    #                         },
    #                         {
    #                             "criteriaDescription": "Seek refuge in an alley",
    #                             "index": 10
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 6,
    #                     "storyline": "The woman earlier reveals herself as an ancient guardian who senses your potential. With her guidance, your powers are awakening, yet the Mages become aware of your growing influence.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Accept her offer to train",
    #                             "index": 11
    #                         },
    #                         {
    #                             "criteriaDescription": "Decline and stick with the Resistance plan",
    #                             "index": 4
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 7,
    #                     "storyline": "Step inside the vaults and embrace the thrill. The tech is mesmerizing, but traps spring everywhere. A misstep leads to a dangerous confrontation with Corporate Guards.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Engage in combat against the Guards",
    #                             "index": 12
    #                         },
    #                         {
    #                             "criteriaDescription": "Use magic to escape",
    #                             "index": 13
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 8,
    #                     "storyline": "Staying back leads to intelligence gathering, yet the Mages discover your presence. The tides are turning against you, and danger lurks closer as you attempt to escape.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Run from the approaching Mages",
    #                             "index": 10
    #                         },
    #                         {
    #                             "criteriaDescription": "Hide and wait for them to pass",
    #                             "index": 14
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 9,
    #                     "storyline": "Fighting back against the creatures helps you rally an impromptu band of citizens. You witness the resistance grow, but the Mages’ power becomes increasingly oppressive.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Lead the group to confront the Mages",
    #                             "index": 15
    #                         },
    #                         {
    #                             "criteriaDescription": "Request aid from the ancient guardian",
    #                             "index": 6
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Fall",
    #                     "levelIndex": 10,
    #                     "storyline": "In the alley, you overhear a plot by the Mages to eliminate the Resistance and gain control of the city. A heavy choice presses upon you - to rush into danger or wait for a chance.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Eavesdrop on the Mages",
    #                             "index": 16
    #                         },
    #                         {
    #                             "criteriaDescription": "Attempt to create a distraction",
    #                             "index": 17
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 11,
    #                     "storyline": "Training with the guardian transforms you. Powers manifest as you rise to become a wielder of both technology and magic, capable of changing the fate of the city.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Confront the corporate leaders",
    #                             "index": 18
    #                         },
    #                         {
    #                             "criteriaDescription": "Join the Resistance with new knowledge",
    #                             "index": 4
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 12,
    #                     "storyline": "Victory in battle against the Guards emboldens your resolve. You secure the tech and lay plans to turn it against the oppressors, stirring a revolution in the heart of Neo Elysium.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Lead a charge against the corporate headquarters",
    #                             "index": 19
    #                         },
    #                         {
    #                             "criteriaDescription": "Return to the Resistance base to strategize",
    #                             "index": 4
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 13,
    #                     "storyline": "Using magic to escape creates a diversion, allowing you to steal important tech. The Resistance flourishes with this newfound strength, and you stand at the center of the growing rebellion.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Plan an attack against the Mages",
    #                             "index": 19
    #                         },
    #                         {
    #                             "criteriaDescription": "Go back and secure more allies",
    #                             "index": 20
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 14,
    #                     "storyline": "Hiding from the Mages, you overhear their plans and learn vital information about their weaknesses. With newfound knowledge, you can strategize an attack effectively.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Inform the Resistance with the details",
    #                             "index": 4
    #                         },
    #                         {
    #                             "criteriaDescription": "Use the information to work on a magical invention",
    #                             "index": 20
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 15,
    #                     "storyline": "Rallying the citizens against the Mages transforms you into a beacon of hope. Together, magic and technology unite in defiance of the oppressive regime.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Charge into the heart of the corporate tower",
    #                             "index": 19
    #                         },
    #                         {
    #                             "criteriaDescription": "Retreat and create hidden safe houses",
    #                             "index": 20
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 16,
    #                     "storyline": "Overhearing the Mages confirms their plans for a decisive strike against the Resistance. With this knowledge, preparing a counteroffensive seems more crucial than ever.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Inform the Resistance swiftly",
    #                             "index": 4
    #                         },
    #                         {
    #                             "criteriaDescription": "Seek allies from outside the city",
    #                             "index": 20
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 17,
    #                     "storyline": "Creating a distraction gives citizens the needed time to escape and gather strength, allowing the Resistance to rebuild and plan for the final confrontation.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Prepare everyone for a united fight",
    #                             "index": 19
    #                         },
    #                         {
    #                             "criteriaDescription": "Explore other avenues for tech improvements",
    #                             "index": 20
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 18,
    #                     "storyline": "Standing before the corporate leaders, you redress their malicious reign and unite the forces of technology and magic, leading to a showdown that will reshape Neo Elysium.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Fight for the city with all you've learned",
    #                             "index": 21
    #                         },
    #                         {
    #                             "criteriaDescription": "Negotiate for peace",
    #                             "index": 22
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 19,
    #                     "storyline": "The charge into the corporate headquarters echoes through the city streets, energy and magic mixing into a singular drive for freedom from oppression.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Confront the CEO of the corporate mages",
    #                             "index": 21
    #                         },
    #                         {
    #                             "criteriaDescription": "Sabotage the tech powering their defenses",
    #                             "index": 22
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 20,
    #                     "storyline": "With hidden safe houses established, the Resistance mounts a decisive campaign against the Mages. A chance of victory looms as unity prevails.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Lead the assault with your allies",
    #                             "index": 21
    #                         },
    #                         {
    #                             "criteriaDescription": "Prepare a secret escape plan",
    #                             "index": 22
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 21,
    #                     "storyline": "With the confrontation over, the city reverberates with either the joy of freedom or the sorrow of defeat. A new dawn emerges, promising change, yet the shadows of the Corporate Mages linger.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Forge a new government with your ally leaders",
    #                             "index": -1
    #                         },
    #                         {
    #                             "criteriaDescription": "Vow to continue the fight against oppression",
    #                             "index": -1
    #                         }
    #                     ]
    #                 },
    #                 {
    #                     "storyArc": "Rise",
    #                     "levelIndex": 22,
    #                     "storyline": "As peace negotiations unfold, a truce offers a moment of hope. Yet the desire for revenge boils under the surface; the future remains uncertain.",
    #                     "nextLevel": [
    #                         {
    #                             "criteriaDescription": "Accept the truce and work towards rebuilding",
    #                             "index": -1
    #                         },
    #                         {
    #                             "criteriaDescription": "Refuse the truce and seek vengeance",
    #                             "index": -1
    #                         }
    #                     ]
    #                 }
    #             ]
    #         }'''
    #     return data

    # def dummy_gen_entity(self, story_node):
    #     '''A dummy method for generating an entity. For integration testing'''
    #     pass

# if __name__ == '__main__':
#     print("phase 2")
#     gpt_client = GPTClient()
#     STORY_DESCRIPTION = "a young girl, \
#         Red, who comes across a cunning wolf on the way to her grandmother's home. \
#         The wolf deceives both her and her grandmother and eats them"
#     STORY_ARC= "Rise-Fall-Rise"
#     NUM_ENDINGS = 2
#     story_node = gpt_client.gen_story_node(STORY_DESCRIPTION, STORY_ARC, NUM_ENDINGS)
#     print(story_node)
