import json
from json import JSONDecodeError
from pydantic import BaseModel, ValidationError

def parse_str_to_dataclass(dataclass: BaseModel, data: str) -> BaseModel | None:
    '''A method for verifying the response structure'''
    try:
        # print("Raw response:", data)  # Debug print
        # print(f"the data type is {type(data)}")
        json_data = json.loads(data)
        # print(f"the json_data type is {type(json_data)}")
        res = dataclass.from_dict(json_data)
        print("✅ Parsing is valid!")
        return res
    except ValidationError as e:
        print("❌ Parsing failed:")
        print(e.json(indent=2))
        print(f"the raw data is {data}")
        return None
    except JSONDecodeError as e:
        print("❌ JSON decoding failed:")
        print(e)
        return None
