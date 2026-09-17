---
weight: 999
title: "Functions Tools Agents Langchain"
description: ""
icon: "article"
date: "2026-03-18T13:16:36+01:00"
lastmod: "2026-03-18T13:16:36+01:00"
draft: false
toc: true
---

This course provides a brief introduction to the syntax of AI tools and LangChain, starting from Function Calling and culminating in the implementation of a simple chat agent.

The code examples from the original course have been updated to reflect the latest LangChain versions, which offer more streamlined methods. Additionally, the examples now use the `gpt-4o-mini` model, which is more cost-effective than `gpt-3.5-turbo`.

**Study Resource:**
[Functions, Tools and Agents with LangChain](https://learn.deeplearning.ai/courses/functions-tools-agents-langchain/lesson/rtwb1/introduction)

The following diagram is a conceptual roadmap rather than an implementation blueprint.  
Its purpose is to show how older LangChain agent patterns relate to modern LangGraph-based workflows.

```mermaid
graph TD
    %% ==========================================
    %% Style Definitions
    %% ==========================================
    classDef core fill:#2d3436,stroke:#74b9ff,stroke-width:2px,color:#fff;
    classDef modern fill:#0984e3,stroke:#74b9ff,stroke-width:2px,color:#fff;
    classDef legacy fill:#b2bec3,stroke:#636e72,stroke-width:2px,stroke-dasharray: 5 5;
    classDef tool fill:#00b894,stroke:#55efc4,stroke-width:2px,color:#fff;
    classDef Finish fill:#6c5ce7,stroke:#6c5ce7,stroke-width:2px,color:#fff;
    classDef Action fill:#e17055,stroke:#e17055,stroke-width:2px,color:#fff;
    classDef diamond fill:#a29bfe,stroke:#6c5ce7,stroke-width:2px;

    %% ==========================================
    %% Nodes & Subgraphs
    %% ==========================================
    Start((User Input))
    LLM[LLM / Reasoning Engine]

    subgraph sg1 [Tools and Equipment]
        Tools[(Tools Arsenal)]
        OldAPI[Legacy OpenAPI Specs]
        NewTool[@tool Decorator]
    end

    subgraph sg2 [Output Routing]
        Router{Model Decision}
        FinishFinish[AgentFinish]
        ActionAction[AgentAction]
    end

    AgentArch{Agent Architecture Engine}

    subgraph sg3 [Legacy: LangChain v0.1]
        Executor[AgentExecutor]
        Scratchpad(Agent Scratchpad)
        ConvMem(ConversationBufferMemory)
    end

    subgraph sg4 [Modern: LangGraph v0.2+]
        Graph[StateGraph / DAG]
        
        subgraph sg4a [State Management]
            StateNode[State Flow]
            NodesNode[Nodes: Agent and Tool]
            EdgesNode[Edges: tools_condition]
        end
        
        subgraph sg4b [State Persistence]
            PersistenceNode[Persistence]
            MemorySaverNode[MemorySaver]
            ThreadNode[Thread ID Isolation]
        end
    end

    %% ==========================================
    %% Safe Links
    %% ==========================================
    Start --> LLM
    
    OldAPI -.->|Incompatible 500 Tools| Tools
    NewTool -->|Native JSON Schema| Tools
    
    LLM <-->|JSON Tool Calling| Tools
    
    Tools --> Router
    Router -->|Direct Response| FinishFinish
    Router -->|Parameter Instructions| ActionAction
    
    ActionAction --> AgentArch
    
    AgentArch -.->|Deprecated| Executor
    Executor -.->|Black-box Loop| Scratchpad
    Executor -.->|Fragile| ConvMem
    
    AgentArch -->|Modern Standard| Graph
    
    Graph -->|State Management| StateNode
    Graph -->|State Persistence| PersistenceNode
    
    StateNode -->|add_messages| NodesNode
    StateNode -->|Auto Routing| EdgesNode
    
    PersistenceNode --> MemorySaverNode
    PersistenceNode --> ThreadNode

    %% ==========================================
    %% Apply Styles
    %% ==========================================
    class LLM core;
    class Tools,NewTool tool;
    class OldAPI legacy;
    class Router,AgentArch diamond;
    class Executor,Scratchpad,ConvMem legacy;
    class Graph,StateNode,PersistenceNode,NodesNode,EdgesNode,MemorySaverNode,ThreadNode modern;
    class FinishFinish Finish;
    class ActionAction Action;
```

---

## **OpenAI Function Calling**


> **Note:** In OpenAI's latest API and official best practices, **`functions` have been replaced by `tools`**. The underlying logic remains exactly the same; the only differences are slight changes in parameter names and nesting structures. This architectural update is designed to support a wider variety of tools beyond just functions in the future.

---

### Principles

**1. When and Why to Use It?**
Function Calling acts as a bridge, allowing the Large Language Model (LLM) to recognize when it needs to delegate specific tasks to pre-written functions. This function could trigger an API call, process a string, or interact with a database—essentially, anything that traditional programming executes reliably and efficiently.

**2. What is the Essence of Function Calling?**

Function calling isn't a separate reasoning mechanism; it’s an interface pattern. Models like `gpt-4o-mini` were extensively fine-tuned on datasets containing "tool descriptions" paired with "standard JSON outputs." This training taught the model exactly how to format its response when it detects that tools are available.

To truly understand how this works under the hood, it helps to contrast the old way with the new:

* **The Legacy Way (ReAct Pattern):** In older frameworks, tools were manually injected into the System Prompt as plain text. Developers could simply `print(prompt)` locally and see the exact instructions (e.g., *"You have access to the following tools..."*) being sent to the model.
* **The Modern Way (Native APIs):** Today, libraries send `messages` and `tools` (JSON schemas) as two separate, cleanly formatted fields to OpenAI's servers. Milliseconds before inference, OpenAI’s backend uses a proprietary template to invisibly merge your JSON tools and chat history into a single massive string. 

Because this final prompt assembly happens entirely on closed-source servers, **it is now an implementation detail.** We can no longer intercept or print this final "plain text string" in our local Python environment.

Here is an example,


```python
<|im_start|>system
You are a helpful assistant.

# Tools
You have access to the following tools:
[
  {
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      ...
    }
  }
]

To use a tool, you must output a JSON block wrapped in special tags like:
<tool_call>
{"name": "get_current_weather", "arguments": "{\\"location\\": \\"Boston\\"}"}
</tool_call>
<|im_end|>
<|im_start|>user
What's the weather like in Boston?<|im_end|>
<|im_start|>assistant
```

**3. Why Does it Consume More Tokens?**

Using tools inherently increases your input token count. Every function you define (its JSON Schema, parameter types, enums, etc.) acts as an "instruction manual" that the model must read on every single request. 

Even though you send these tools via a separate API field, the provider's backend still merges this entire manual into the model's context window. Therefore, the more tools you provide and the more detailed your descriptions are, the more tokens you consume per turn.

---

### Reference Code

```python
from openai import OpenAI
import json

client = OpenAI()

# 1. Define the local function
def get_current_weather(location, unit="fahrenheit"):
    """Get the current weather in a given location"""
    weather_info = {
        "location": location,
        "temperature": "72",
        "unit": unit,
        "forecast": ["sunny", "windy"],
    }
    return json.dumps(weather_info)

# 2. Define the Tools Schema
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "The city and state, e.g. Boston, MA"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        }
    }
]

# ==================== Process Starts ====================

messages = [
    {"role": "user", "content": "What's the weather like in Boston?"}
]

print("\n" + "="*50)
print("🟡 [Before 1st Model Call] Messages sent to the LLM:")
print(json.dumps(messages, indent=2))
print("="*50 + "\n")

# First model call
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools 
)

response_message = response.choices[0].message

print("\n🔍 [Debug] Inspecting the actual structure of response_message:")

# 1. Use .model_dump() to convert the object into a standard Python dictionary
# exclude_unset=True filters out empty fields (like null) for a cleaner printout
message_dict = response_message.model_dump(exclude_unset=True)

# 2. Use json.dumps for formatted printing with indentation
print(json.dumps(message_dict, indent=2, ensure_ascii=False))
print("-" * 40 + "\n")

if response_message.tool_calls:
    print("🤖 The LLM decided: I won't answer directly, I need to call a tool!\n")
    
    # [Crucial Step 1] Append the LLM's 'tool call request' to the message history as-is
    messages.append(response_message)
    
    for tool_call in response_message.tool_calls:
        function_name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        
        # Execute the code locally
        print(f"⚙️ Python is executing the function locally: {function_name}({args})")
        observation = get_current_weather(**args)
        print(f"✅ Python retrieved the local result: {observation}\n")
        
        # [Crucial Step 2] Wrap the execution result as a role: "tool" message and append to history
        messages.append(
            {
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": observation,
            }
        )
    
    print("\n" + "="*50)
    print("🟢 [Before 2nd Model Call] Messages ready to be sent to the LLM:")
    # Note: Because response_message is an object, we cast it to a dict for easier printing
    printable_messages = [
        msg.model_dump(exclude_unset=True) if hasattr(msg, 'model_dump') else msg 
        for msg in messages
    ]
    print(json.dumps(printable_messages, indent=2))
    print("="*50 + "\n")

    # Second model call: The model looks at the newly retrieved temperature data and summarizes an answer
    final_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )
    
    print("🎉 [Final Result] The LLM answered based on the tool's returned data:")
    print(final_response.choices[0].message.content)
else:
    print("Direct model response:", response_message.content)
```


```
==================================================
🟡 [Before 1st Model Call] Messages sent to the LLM:
[
  {
    "role": "user",
    "content": "What's the weather like in Boston?"
  }
]
==================================================

🔍 [Debug] Inspecting the actual structure of response_message:
{
  "content": null,
  "refusal": null,
  "role": "assistant",
  "annotations": [],
  "tool_calls": [
    {
      "id": "call_1fa0oAa6ZsQPOqXekVBRZ9nE",
      "function": {
        "arguments": "{\"location\":\"Boston, MA\"}",
        "name": "get_current_weather"
      },
      "type": "function"
    }
  ]
}
----------------------------------------

🤖 The LLM decided: I won't answer directly, I need to call a tool!

⚙️ Python is executing the function locally: get_current_weather({'location': 'Boston, MA'})
✅ Python retrieved the local result: {"location": "Boston, MA", "temperature": "72", "unit": "fahrenheit", "forecast": ["sunny", "windy"]}

==================================================
🟢 [Before 2nd Model Call] Messages ready to be sent to the LLM:
[
  {
    "role": "user",
    "content": "What's the weather like in Boston?"
  },
  {
    "content": null,
    "refusal": null,
    "role": "assistant",
    "annotations": [],
    "tool_calls": [
      {
        "id": "call_1fa0oAa6ZsQPOqXekVBRZ9nE",
        "function": {
          "arguments": "{\"location\":\"Boston, MA\"}",
          "name": "get_current_weather"
        },
        "type": "function"
      }
    ]
  },
  {
    "tool_call_id": "call_1fa0oAa6ZsQPOqXekVBRZ9nE",
    "role": "tool",
    "name": "get_current_weather",
    "content": "{\"location\": \"Boston, MA\", \"temperature\": \"72\", \"unit\": \"fahrenheit\", \"forecast\": [\"sunny\", \"windy\"]}"
  }
]
==================================================

🎉 [Final Result] The LLM answered based on the tool's returned data:
The current weather in Boston, MA is 72°F, and it's sunny and windy.
```

---

### Supplementary Notes

**Regular Conversations (No Tools Required)**

When a user simply greets the model without triggering a tool:

```python
messages = [
    {
        "role": "user",
        "content": "hi!",
    }
]
```

**Result**
```python
{
  "content": "Hello! How can I assist you today?",
  "refusal": null,
  "role": "assistant",
  "annotations": []
}
```

**Key Observations from the Comparison:**

- The `content` field is no longer `null`; it contains a standard text greeting.

- The `tool_calls` field is completely absent from the structure (or evaluates to `None`).

This demonstrates why, in production code, we must always use an `if response_message.tool_calls`: conditional statement to determine which path the model chose to take.

**The `tool_choice` Parameter**
This parameter gives you control over how the model interacts with the provided tools. It supports the following arguments: `"auto"`**(Default)**, `"none"`, `"required"`, and specific Tool.

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=message_weather,
    tools=tools,
    # tool_choice="auto"
    # tool_choice={"type": "function", "function": {"name": "get_current_weather"}}
)
```

## **LangChain Expression Language (LCEL)**

---

### Overview

LCEL is a declarative language designed for composing LangChain components into chains using the Unix pipe operator `|`.

**1. What is LangChain and LCEL?**

* **LangChain** is a framework for building LLM-powered applications.
* **LCEL** is the declarative syntax for chaining these components (Prompts, Models, Output Parsers, etc.) together. Conceptually, this syntax is highly analogous to **function composition (`compose`)** in functional programming.

**2. The Unified Interface (Runnable Interface)**

To ensure seamless chaining, core LangChain components implement the **`Runnable Interface`**. This standardizes invocation methods across different components:
* `invoke()`: Single input to single output.
* `stream()`: Stream back chunks of the response.
* `batch()`: List of inputs to list of outputs (handled in parallel).
* **Async** versions also exist (`ainvoke`, `astream`, `abatch`).

**3. Why Use LCEL? (Key Benefits)**

* **Streaming Support:** Get the first token out as soon as possible.
* **Automatic Batching/Parallelism:** Branches in your chain execute in parallel, reducing latency.
* **Asynchronous:** Seamlessly use async methods.
* **Optimized Execution:** Optimized steps (like retry logic) can be added easily.

---

### Simple Example

This demonstrates the most basic LCEL pipeline: `Prompt | Model | Output Parser`.

**Code Example:**

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# Configure Prompt, Model (using gpt-4o-mini), and Parser
prompt = ChatPromptTemplate.from_template("tell me a short joke about {topic}")
model = ChatOpenAI(model="gpt-4o-mini")
output_parser = StrOutputParser()

# Compose the chain using pipe '|'
chain = prompt | model | output_parser

# Invoke the chain
result = chain.invoke({"topic": "bears"})
print("Joke:", result)
```

**Result:**
```
Joke: Why don't bears like fast food?  
Because they can't catch it!
```

---

### RAG / RunnableParallel Example

This example uses RAG (Retrieval-Augmented Generation) to demonstrate complex input handling. It utilizes `RunnableParallel` to concurrently prepare the `context` and `question` inputs required by the prompt.

> Note: The course originally used `RunnableMap`. `RunnableParallel` is the modern, conceptually clearer replacement.

We use `RunnablePassthrough` to pass user input directly through the parallel branches without modification.

**Analogies:**

- **Functional Programming:** Similar to parallel branch execution.

- **JavaScript:** Very similar to Promise.all, where multiple asynchronous branches execute simultaneously, and the chain waits for all results to be resolved before moving to the prompt.

**Code Example:**
```python
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_openai import OpenAIEmbeddings
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

# 1. Setup Retrieval (Vector Database in memory)
# Requires 'docarray' and 'tiktoken' packages
vectorstore = DocArrayInMemorySearch.from_texts(
    ["harrison worked at kensho", "bears like to eat honey"],
    embedding=OpenAIEmbeddings()
)
retriever = vectorstore.as_retriever()

# 2. Setup Prompt
template = """Answer the question based only on the following context:
{context}

Question: {question}
"""
prompt_rag = ChatPromptTemplate.from_template(template)

# 3. Compose RAG Chain
# RunnableParallel executes the dictionary branches concurrently.
# input_dict["question"] -> goes to context branch (retriever)
# input_dict["question"] -> goes to question branch (passthrough)
chain_rag = RunnableParallel({
    "context": lambda x: retriever.invoke(x["question"]), # Updates to standard invoke
    "question": RunnablePassthrough() # Passes through input untouched
}) | prompt_rag | model | output_parser

# Invoke
print("RAG Result:", chain_rag.invoke({"question": "where did harrison work?"}))
```

**Result:**
```
RAG Result: Harrison worked at Kensho.
```

Here is the result of RunnableParallel
```
context: [Document(metadata={}, page_content='harrison worked at kensho'), Document(metadata={}, page_content='bears like to eat honey')]
question: {'question': 'where did harrison work?'}
```

In modern LCEL, passing a direct string (`chain.invoke("...")`) combined with `RunnablePassthrough()` is generally preferred for simple queries. However, if multiple variables are required, passing a dictionary and extracting values using `itemgetter` is the standard approach.

---

### Bind

We can bind arguments (like functions/tools) to a model before execution. This is conceptually similar to `JS.prototype.bind` or creating a partially applied function.

While the modern standard uses `.bind_tools(tools)`, this demonstrates binding a traditional function schema for legacy compatibility.

**Code Example:**
```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

tools_schema = [
    {
      "type": "function",
      "function": {
          "name": "weather_search",
          "description": "Search for weather given an airport code",
          "parameters": {
            "type": "object",
            "properties": {
              "airport_code": {"type": "string", "description": "The airport code"}
            },
            "required": ["airport_code"]
          }
      }
    }
]
  
prompt_bind = ChatPromptTemplate.from_messages([("human", "{input}")])

model_bound = ChatOpenAI(model="gpt-4o-mini", temperature=0).bind_tools(tools_schema)

runnable = prompt_bind | model_bound

response = runnable.invoke({"input": "what is the weather in sf"})

print(json.dumps(response.tool_calls, indent=2, ensure_ascii=False))
```

**Result:**
```
[
  {
    "name": "weather_search",
    "args": {
      "airport_code": "SFO"
    },
    "id": "call_UpcweQ7M6L8fW1Wp9iFIV7Fr",
    "type": "tool_call"
  }
]
```

---

### Fallbacks

LCEL provides a graceful degradation mechanism via fallbacks. If the primary chain fails, it sequentially attempts the backup chains provided in `with_fallbacks`.

**Code Snippet Logic:**

```Python
# Syntax: primary_chain.with_fallbacks([backup_chain1, backup_chain2])
final_chain = simple_chain.with_fallbacks([chain])
```
It first attempts `simple_chain`. If that fails (e.g., API is down, model rate limit), it proceeds to execute `chain`.

---

### Architecture Insights: API vs. LCEL vs. LangGraph

**1. Native API vs. LangChain**
* **Use Native API when:** You are building simple scripts, require absolute control over prompts, or need maximum performance and the lowest latency without framework overhead.
* **Use LangChain when:** You are building complex workflows (like RAG), utilizing various third-party integrations, or need seamless model swapping (e.g., switching from OpenAI to DeepSeek without rewriting the core pipeline).

**2. LangChain (LCEL) vs. LangGraph**
* **LangChain (LCEL):** Operates as a **Pipeline (Directed Acyclic Graph - DAG)**. Data flows sequentially in one direction. It is perfect for linear execution but inherently lacks the ability to loop.
* **LangGraph:** Operates as a **State Machine**. It was designed specifically to build true autonomous Agents. Unlike LCEL, LangGraph natively supports `while` loops, conditional routing, and cyclic execution (Think → Act → Observe → Repeat), completely replacing the rigid, black-box `AgentExecutor` of the past.

## **OpenAI Function Calling with LangChain & Pydantic**

---

**Overview**

The primary evolution in this section is replacing cumbersome, manual JSON schemas with **Pydantic**. As the standard data validation library in the Python ecosystem *(if you've used FastAPI, you already know its power)*, using Pydantic's `BaseModel` brings several key benefits to LLM development:

* **Zero Manual Schemas:** Auto-generates JSON schemas directly from your Python classes.
* **Pythonic & Type-Safe:** Minimizes human error and provides rich IDE auto-completion.
* **Multi-Tool Binding:** Streamlines the process of passing multiple tools to the model simultaneously.

The example below demonstrates this modern, streamlined approach in action.

---

### Code Example

```python
import json
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 1. Define tools using Pydantic BaseModel
class WeatherSearch(BaseModel):
    """Call this with an airport code to get the weather at that airport"""
    airport_code: str = Field(description="airport code to get weather for")

class ArtistSearch(BaseModel):
    """Call this to search for an artist"""
    artist_name: str = Field(description="name of the artist")

# 2. Initialize the model
model = ChatOpenAI(model="gpt-4o-mini")

# 3. Modern Binding: Pass the Pydantic classes directly to bind_tools
model_with_tools = model.bind_tools([WeatherSearch, ArtistSearch])

bound_tools_list = model_with_tools.kwargs["tools"]
print(json.dumps(bound_tools_list, indent=2, ensure_ascii=False))

# 4. Compose the LCEL Chain
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant"),
    ("user", "{input}")
])

chain = prompt | model_with_tools

# --- Test Case 1: Model decides to use a tool ---
response_tool = chain.invoke({"input": "what is the weather in sf?"})
print("🤖 Test 1 - Model decided to call a tool:")
print(json.dumps(response_tool.tool_calls, indent=2, ensure_ascii=False))

# --- Test Case 2: Model decides to answer directly (tool_choice="auto") ---
response_chat = chain.invoke({"input": "what are three songs by taylor swift?"})
print("\n💬 Test 2 - Model bypassed tools and answered directly:")
print(response_chat.content)
```

**Execution Logs**
```
[
  {
    "type": "function",
    "function": {
      "name": "WeatherSearch",
      "description": "Call this with an airport code to get the weather at that airport",
      "parameters": {
        "properties": {
          "airport_code": {
            "description": "airport code to get weather for",
            "type": "string"
          }
        },
        "required": [
          "airport_code"
        ],
        "type": "object"
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "ArtistSearch",
      "description": "Call this to search for an artist",
      "parameters": {
        "properties": {
          "artist_name": {
            "description": "name of the artist",
            "type": "string"
          }
        },
        "required": [
          "artist_name"
        ],
        "type": "object"
      }
    }
  }
]
🤖 Test 1 - Model decided to call a tool:
[
  {
    "name": "WeatherSearch",
    "args": {
      "airport_code": "SFO"
    },
    "id": "call_lg44XcNcFrw81IpwMizmJodr",
    "type": "tool_call"
  }
]

💬 Test 2 - Model bypassed tools and answered directly:
```

## **Tagging and Extraction (Modern LangChain)**

We can leverage Large Language Models (LLMs) to automatically comprehend natural language, apply specific tags, extract targeted information, and guarantee the output strictly adheres to our desired formatting.

**1. The Revolution of `.with_structured_output()`**
In this section, we utilize the modern `.with_structured_output()` method, which drastically improves the developer experience:

* **Zero Boilerplate:** You no longer need to worry about manually configuring `tool_choice` under the hood or stitching together complex parsers (like `JsonOutputFunctionsParser`). It handles the wiring for you.
* **Direct Type Safety:** Legacy approaches often squeezed out standard Python dictionaries (`dict`). The modern approach returns **instantiated Pydantic objects** directly! In large-scale engineering, this means you can write `result.people[0].name` and instantly enjoy IDE auto-completion and static type checking. It is an absolute lifesaver for backend developers.

**2. Tagging vs. Extraction: What's the Difference?**
Structurally, Tagging and Extraction look identical (both use Pydantic classes), but their business logic differs:

* **Tagging (Classification):** Focuses on semantic understanding. The classes define abstract attributes (e.g., `sentiment`, `language`, `tone`), asking the LLM to make a subjective or categorical judgment about the text.
* **Extraction (Entity Recognition):** Focuses on pulling explicit facts. The classes use concrete keys (e.g., `name`, `age`, `location`). Here, the LLM acts as a high-powered regex, pulling out specific data without adding subjective interpretation.

---

### Tagging and Extraction

```python
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_text_splitters import RecursiveCharacterTextSplitter

model = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ==========================================
# 1. Tagging
# ==========================================
class Tagging(BaseModel):
    """Tag the piece of text with particular info."""
    sentiment: str = Field(description="sentiment of text, should be `pos`, `neg`, or `neutral`")
    language: str = Field(description="language of text (should be ISO 639-1 code)")

tagging_chain = model.with_structured_output(Tagging)

print("🏷️ Tagging Testing:")
result = tagging_chain.invoke("non mi piace questo cibo")
print(result) 

# ==========================================
# 2. Extraction
# ==========================================
class Person(BaseModel):
    name: str = Field(description="person's name")
    age: Optional[int] = Field(description="person's age")
 
class Information(BaseModel):
    people: List[Person] = Field(description="List of info about people")

prompt_extract = ChatPromptTemplate.from_messages([
    ("system", "Extract the relevant information, if not explicitly provided do not guess."),
    ("human", "{input}")
])

extraction_model = model.with_structured_output(Information)
extraction_chain = prompt_extract | extraction_model

print("\n🔍 Extraction Testing:")
result2 = extraction_chain.invoke({"input": "Joe is 30, his mom is Martha"})
print(result2)
```

```
🏷️ Tagging Testing:
sentiment='neg' language='it'

🔍 Extraction Testing:
people=[Person(name='Joe', age=30), Person(name='Martha', age=None)]

```
---

### Text Splitters & Map-Reduce (Handling Long Documents)

**The Problem:** Feeding a massive document directly into an LLM can exceed the context window limit and significantly degrade the accuracy of the extraction (often leading to hallucinations or missed data). 

**The Solution:** We use tools like `RecursiveCharacterTextSplitter` to break the document into smaller, digestible chunks.

**The Magic of LCEL Concurrency:**
Using `extraction_chain.map()` is one of the most stunning features of LangChain Expression Language (LCEL). If you pass a list of 10 text chunks to it, LCEL doesn't process them one by one. Under the hood, it **automatically fires off 10 concurrent network requests** to process all chunks in parallel, drastically slashing the total execution time.

```python
# ==========================================
# 3. Map Reduce
# ==========================================
text_splitter = RecursiveCharacterTextSplitter(chunk_size=20, chunk_overlap=0)
sample_text = "Joe is 30. Martha is 50. Alice is 25."

def flatten(matrix):
    # flatten: [[Person1], [Person2]] -> [Person1, Person2]
    return [item for row in matrix for item in row.people] 

prep = RunnableLambda(
    lambda text: [{"input": chunk} for chunk in text_splitter.split_text(text)]
)

map_chain = prep | extraction_chain.map() | flatten

print("\n🗺️ Map Extraction:")
result3 = map_chain.invoke(sample_text)
print(result3)

```

```

🗺️ Map Extraction:
[Person(name='Joe', age=30), Person(name='Martha', age=None), Person(name='Alice', age=25)]
```

## **Tools and Routing**

The core objective of this chapter is understanding how to wrap existing code or APIs into tools that Large Language Models (LLMs) can utilize, and how to implement basic routing based on the model's decisions.

---

### Create a Simple Tool

**The Essence of `@tool`: Model vs. Developer Perspective**

There is a fundamental difference between how the LLM views a tool and how your local code (the Agent) handles it:

* **The LLM’s Perspective (Identical):** To the LLM, a LangChain Tool and a raw function look exactly the same. The framework just sends a JSON Schema, and the model simply returns a structured command (e.g., `{"name": "get_temp", "args": {"location": "SF"}}`).
* **The Developer’s Perspective (Transformative):** * *Without `@tool`:* You only define the schema. You must write manual routing logic (like verbose `if/else` chains or dictionaries) to map the model's output to the correct local function.
  * *With `@tool`:* The decorator tightly binds the "Schema" (`.name`, `.description`) and the "Execution Action" (`.invoke()`) into a single object.
* **Why this matters for Agents:** This encapsulation is the foundation of autonomous Agents. Instead of writing 100 `if/else` conditions for 100 tools, the Agent’s engine can dynamically retrieve the tool object by name and call `.invoke()`.



```python
import requests
import datetime
from pydantic import BaseModel, Field
from langchain_core.tools import tool

# 1. Define the input schema using Pydantic
class OpenMeteoInput(BaseModel):
    latitude: float = Field(..., description="Latitude of the location to fetch weather data for")
    longitude: float = Field(..., description="Longitude of the location to fetch weather data for")

# 2. Use @tool to register it as a LangChain Tool
@tool(args_schema=OpenMeteoInput)
def get_current_temperature(latitude: float, longitude: float) -> str:
    """Fetch current temperature for given coordinates."""
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'hourly': 'temperature_2m',
        'forecast_days': 1,
    }

    response = requests.get(BASE_URL, params=params)
    if response.status_code != 200:
        raise Exception(f"API Request failed with status code: {response.status_code}")

    results = response.json()
    current_utc_time = datetime.datetime.utcnow()
    time_list = [datetime.datetime.fromisoformat(time_str.replace('Z', '+00:00')) for time_str in results['hourly']['time']]
    temperature_list = results['hourly']['temperature_2m']
    
    closest_time_index = min(range(len(time_list)), key=lambda i: abs(time_list[i] - current_utc_time))
    current_temperature = temperature_list[closest_time_index]
    
    return f'The current temperature is {current_temperature}°C'

# You can directly invoke the tool locally to test it:
print("Local Tool Test:", get_current_temperature.invoke({"latitude": 13, "longitude": 14}))

```

```
Local Tool Test: The current temperature is 36.5°C
```

---

### An API Example

**The API Dilemma: Why converting APIs to Tools doesn't scale**

Converting APIs into tools works perfectly for 2-3 functions. However, this approach hits a catastrophic bottleneck in real-world scenarios (e.g., an OpenAPI spec with 500+ endpoints).

> **Note:** The original course used `openapi_spec_to_openai_fn` to blindly convert every single API endpoint into a distinct OpenAI Tool. We have completely abandoned this approach in favor of `create_openapi_agent`. Here is why:

* **The Legacy Approach (Static Full Binding):** Forces 500 endpoints into 500 dedicated JSON schemas and binds them all to the LLM at once. 
  * **Token Explosion:** Injects 500 schemas into the system prompt on *every turn*, instantly overflowing the context window and skyrocketing costs.
  * **Choice Paralysis:** Faced with 500 highly similar tools, the model's attention mechanism degrades, leading to severe hallucinations and incorrect arguments.

* **The Modern Approach (Agentic Dynamic Retrieval):** Instead of generating 500 distinct tools, the modern `create_openapi_agent` compresses the API spec into text and provides the model with only a few generic tools (e.g., `requests_get`, `requests_post`). 
  * **How it works:** The model acts as a smart engineer. It reads the compressed spec as a document to find the correct endpoint and parameters, and then uses a generic HTTP tool to execute the request.

```python
from langchain_community.utilities.openapi import OpenAPISpec
from langchain_community.agent_toolkits.openapi.spec import reduce_openapi_spec
from langchain_community.utilities.requests import TextRequestsWrapper
from langchain_community.agent_toolkits.openapi.planner import create_openapi_agent
from langchain_openai import ChatOpenAI
import json

text = """
{
  "openapi": "3.0.0",
  "info": {
    "version": "1.0.0",
    "title": "Swagger Petstore",
    "license": {
      "name": "MIT"
    }
  },
  "servers": [
    {
      "url": "http://petstore.swagger.io/v1"
    }
  ],
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "operationId": "listPets",
        "tags": [
          "pets"
        ],
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "description": "How many items to return at one time (max 100)",
            "required": false,
            "schema": {
              "type": "integer",
              "maximum": 100,
              "format": "int32"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "A paged array of pets",
            "headers": {
              "x-next": {
                "description": "A link to the next page of responses",
                "schema": {
                  "type": "string"
                }
              }
            },
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pets"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a pet",
        "operationId": "createPets",
        "tags": [
          "pets"
        ],
        "responses": {
          "201": {
            "description": "Null response"
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/pets/{petId}": {
      "get": {
        "summary": "Info for a specific pet",
        "operationId": "showPetById",
        "tags": [
          "pets"
        ],
        "parameters": [
          {
            "name": "petId",
            "in": "path",
            "required": true,
            "description": "The id of the pet to retrieve",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Expected response to a valid request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Pet"
                }
              }
            }
          },
          "default": {
            "description": "unexpected error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Pet": {
        "type": "object",
        "required": [
          "id",
          "name"
        ],
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "name": {
            "type": "string"
          },
          "tag": {
            "type": "string"
          }
        }
      },
      "Pets": {
        "type": "array",
        "maxItems": 100,
        "items": {
          "$ref": "#/components/schemas/Pet"
        }
      },
      "Error": {
        "type": "object",
        "required": [
          "code",
          "message"
        ],
        "properties": {
          "code": {
            "type": "integer",
            "format": "int32"
          },
          "message": {
            "type": "string"
          }
        }
      }
    }
  }
}
"""

# 1. 【Core Fix】Use Python's native json library to convert the string into a regular dictionary
raw_spec_dict = json.loads(text)

# 2. Compress the dictionary (the new version of the reduce function only needs the native dictionary)
reduced_spec = reduce_openapi_spec(raw_spec_dict)

# 3. Create the network request wrapper
requests_wrapper = TextRequestsWrapper(headers={})
llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")

# 4. Create and run the OpenAPI Agent
agent_executor = create_openapi_agent(
    api_spec=reduced_spec,
    requests_wrapper=requests_wrapper,
    llm=llm,
    allow_dangerous_requests=True  # Authorize the Agent to send real network requests
)

print("🤖 Modern Agent is starting execution:")
# At this point, the LLM will read the API documentation by itself, 
# decide which endpoint to call, and make the actual request!
agent_executor.invoke("what are three pets names")

```

```bash
🤖 Modern Agent is starting execution:


[1m> Entering new AgentExecutor chain...[0m
[32;1m[1;3mAction: api_planner  
Action Input: I need to find the right API calls to retrieve the names of three pets.  [0m
Observation: [36;1m[1;3m1) The user query can be solved by the API documented below, as it involves retrieving information about pets.

2) Plan:
   1. GET /pets to retrieve a list of all pets.
   2. From the response, extract the names of the first three pets.

(Note: The API does not specify a limit on the number of pets returned, so we assume it will return enough data to extract three names.)[0m
Thought:[32;1m[1;3mI am ready to execute the API calls.  
Action: api_controller  
Action Input: 1) GET /pets to retrieve a list of all pets.  [0m

[1m> Entering new AgentExecutor chain...[0m
[32;1m[1;3mAction: requests_get  
Action Input: {"url":"http://petstore.swagger.io/v1/pets","params":{},"output_instructions":"Extract the id(s) and name(s) of the pets."}  [0m
Observation: [36;1m[1;3mThe API response indicates a "404 Not Found" error. This means that the requested resource could not be found. 

Summary of the error: 
- Error Code: 404
- Error Message: Not Found
- Server: nginx[0m
Thought:[32;1m[1;3mI encountered a "404 Not Found" error when trying to access the `/pets` endpoint. This suggests that the endpoint may not exist or there may be an issue with the API URL. 

To troubleshoot, I will double-check the base URL and the endpoint path. The base URL is `http://petstore.swagger.io/v1`, and the endpoint for retrieving pets is `/pets`. 

Since the endpoint appears to be correct, I will attempt to access the base URL directly to see if the server is reachable and if there are any available endpoints.

Plan: 1) GET the base URL to check if the server is reachable and to see available endpoints.
Thought:
Action: requests_get  
Action Input: {"url":"http://petstore.swagger.io/v1","params":{},"output_instructions":"Check if the server is reachable and list available endpoints."}  [0m
Observation: [36;1m[1;3mThe API response indicates an error with a "404 Not Found" status. This means that the requested resource or endpoint is not available on the server. 

Summary of the error:
- **Error Code**: 404
- **Error Message**: Not Found
- **Server**: nginx

Since the server is not reachable for the requested endpoint, there are no available endpoints to list.[0m
Thought:[32;1m[1;3mI encountered a "404 Not Found" error when trying to access both the `/pets` endpoint and the base URL. This indicates that the server is not responding correctly to the requests, and the endpoints I am trying to access may not exist or the server may be down.

Given that I cannot retrieve any information from the API due to these errors, I cannot proceed with any further API calls or actions.

Final Answer: I am unable to complete the API calls due to a "404 Not Found" error for both the `/pets` endpoint and the base URL. The server may be down or the endpoints may not exist.[0m

[1m> Finished chain.[0m

Observation: [33;1m[1;3mI am unable to complete the API calls due to a "404 Not Found" error for both the `/pets` endpoint and the base URL. The server may be down or the endpoints may not exist.[0m
Thought:[32;1m[1;3mI need to reassess the situation since the initial API call to retrieve pet names resulted in a "404 Not Found" error. This could mean that the endpoint is incorrect or that there are no pets available. I should check if there are alternative endpoints or methods to retrieve pet names.

Action: api_planner  
Action Input: I need to explore the available API endpoints to find a valid way to retrieve pet names.  [0m
Observation: [36;1m[1;3mSorry, this API's domain is focused on pets, but it does not provide a specific endpoint to retrieve a list of pet names. The available endpoints are for getting all pets, posting new pets, and getting details of a specific pet by ID.[0m
Thought:[32;1m[1;3mI need to find a specific pet by ID to retrieve its name, as the general endpoint for retrieving all pets is not functioning. I will plan to get the details of a specific pet instead. 

Action: api_planner  
Action Input: I need to find the right API calls to retrieve the names of specific pets by their IDs.  [0m
Observation: [36;1m[1;3m1) Yes, the user query can be solved by the API. The user wants to retrieve the names of specific pets by their IDs, which can be done using the GET /pets/{petId} endpoint.

2) Plan:
   1. The user needs to provide the specific pet IDs they want to retrieve names for.
   2. For each pet ID provided, make a GET request to /pets/{petId} to retrieve the details of each pet, which will include their names.

Note: Since the user did not specify the pet IDs, you will need to ask them to provide those IDs first.[0m
Thought:[32;1m[1;3mI need to ask the user for the specific pet IDs to proceed with retrieving their names.  
Action: api_controller  
Action Input: I need to ask the user for the specific pet IDs they want to retrieve names for.  [0m

[1m> Entering new AgentExecutor chain...[0m
[32;1m[1;3mI need to gather specific pet IDs from the user to proceed with retrieving their names. 

Action: None (waiting for user input)

Final Answer: Please provide the specific pet IDs you would like to retrieve names for.[0m

[1m> Finished chain.[0m

Observation: [33;1m[1;3mPlease provide the specific pet IDs you would like to retrieve names for.[0m
Thought:[32;1m[1;3mI have asked the user for the specific pet IDs needed to retrieve their names. I will wait for their response to proceed with the API calls.  
Final Answer: Please provide the specific pet IDs you would like to retrieve names for.[0m

[1m> Finished chain.[0m
```
---

### Simple Routing

In modern LCEL pipelines, routing the model's output has become incredibly straightforward. We simply inspect the `AIMessage` returned by the LLM. If the model decides to converse, it returns standard text. If it decides to use a tool, it populates the `tool_calls` attribute. 

> **Note:** In older LangChain versions (and the original course), developers had to rely on complex output parsers to convert the model's text into specific `AgentAction` (tool requests) or `AgentFinish` (final responses) objects. With modern native tool calling, these heavy abstractions are obsolete. We now simply use standard Python `if/else` logic to check `ai_message.tool_calls`.

**Code Example:**

```Python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# Simulate another tool
@tool
def search_wikipedia(query: str) -> str:
    """Search wikipedia for information."""
    return f"Wikipedia result for {query}"

tools = [search_wikipedia, get_current_temperature]

# Modern bind_tools approach
model = ChatOpenAI(temperature=0).bind_tools(tools)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are helpful but sassy assistant"),
    ("user", "{input}"),
])

chain = prompt | model

result = chain.invoke({"input": "What is the weather in san francisco right now?"})

# Simple route(manually)
def simple_route(ai_message):
    if not ai_message.tool_calls:
        # AgentFinish: No tool called, return normal chat
        return ai_message.content
    else:
        # AgentAction: Tool called, execute it manually
        tool_call = ai_message.tool_calls[0]
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        
        available_tools = {
            "search_wikipedia": search_wikipedia, 
            "get_current_temperature": get_current_temperature,
        }
        
        print(f"Routing to tool: {tool_name} with args {tool_args}")
        # Execute the tool
        return available_tools[tool_name].invoke(tool_args)

print("Routed Result:", simple_route(result))

```

```
Routing to tool: get_current_temperature with args {'latitude': 37.7749, 'longitude': -122.4194}
Routed Result: The current temperature is 13.0°C

```

## **Conversational Agents (The LangGraph Era)**

**The Architectural Shift:** The legacy `AgentExecutor` was a rigid, black-box `while` loop that often broke due to strict message sequencing errors. The modern solution is **LangGraph**. LangGraph models the agent as an explicit stateful graph, which is much closer to a state machine than a simple linear chain.

---

### A Simple Agent

**Core Concepts of LangGraph**
* **Nodes:** The workstations that execute specific actions (e.g., LLM inference, Tool execution).
* **Edges:** The logic paths (conditional or fixed) that determine where data flows next.
* **State:** A shared dictionary (usually maintaining the `messages` list) that persists and updates as it flows across all nodes.
* **Persistence:** The ability to save the graph's state for long-term session management.

```python
import json
from typing import Annotated, TypedDict
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END, add_messages
from langgraph.prebuilt import ToolNode, tools_condition


# 1. Define the state: Use add_messages to tell the graph that new messages 
#    should be appended to the existing ones instead of overwriting them.
class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# 2. Define tools
@tool
def get_weather(location: str):
    """Fetch the current weather for a location."""
    return f"It's sunny and 22°C in {location}"


tools = [get_weather]


# 3. Key step: Bind tools to the model
model = ChatOpenAI(model="gpt-4o-mini", temperature=0).bind_tools(tools)


# 4. Define node logic
def call_model(state: State):
    # Invoke the model and return its response
    response = model.invoke(state["messages"])
    return {"messages": [response]}


# 5. Build the graph
workflow = StateGraph(State)

# Add the agent node
workflow.add_node("agent", call_model)
# Add the prebuilt tool execution node (it automatically handles message handling)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")

# 🌟 The magic: tools_condition is LangGraph's official helper
# It automatically checks if the model generated tool_calls.
# If yes → go to "tools" node; if no → END.
workflow.add_conditional_edges("agent", tools_condition)

# After tools finish executing, route back to the agent so it can
# generate a final response based on the tool results.
workflow.add_edge("tools", "agent")

app = workflow.compile()


# 6. Run the test
print("🚀 LangGraph Agent is starting...")
inputs = {"messages": [HumanMessage(content="What is the weather in SF?")]}
for output in app.stream(inputs, stream_mode="values"):
    last_message = output["messages"][-1]
    print(f"\nRole: {last_message.type}")
    if last_message.content:
        print(f"Content: {last_message.content}")
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        print(f"Tool Calls: {last_message.tool_calls}")
```

```
🚀 LangGraph Agent is starting...

Role: human
Content: What is the weather in SF?

Role: ai
Tool Calls: [{'name': 'get_weather', 'args': {'location': 'San Francisco'}, 'id': 'call_cvQTiL0pv9sG5nMaGQlmOCCj', 'type': 'tool_call'}]

Role: tool
Content: It's sunny and 22°C in San Francisco

Role: ai
Content: The weather in San Francisco is sunny with a temperature of 22°C.
```

---

### Chat history

**Memory Evolution: Chat Memory vs. State Persistence**
There is a massive paradigm shift in how "Memory" is handled in modern Agentic workflows. 

- The Legacy Way (e.g., `ConversationBufferMemory`):
* *How it works:* Automatically stores the last *N* messages and appends them to the prompt. 
* *Pros:* Simple, one-liner, great for quick demos.
* *Cons:* It's a black box. It lacks control, doesn't support multiple concurrent users, cannot resume interrupted workflows, and fails to track complex tool-calling sequences.

- The Modern LangGraph Way (`MemorySaver`):
In LangGraph, we no longer just save "Chat History"; we save the **Entire Agent State**. This is achieved through two core mechanisms:
1. **Checkpointer:** An object that saves a snapshot of the entire graph's state at every single node transition.
2. **Thread ID:** A unique session identifier (e.g., `user_bob_123`). 

**The Advantages of State Persistence:**
* **Multi-User Support:** The Thread ID ensures complete isolation between different users' states.
* **Tool State Tracking:** It remembers not just what the user said, but the exact tools the Agent used and the intermediate observations it gathered.
* **Interruption & Resumption:** Because the entire state is checkpointed, you can pause an Agent mid-thought, wait for human approval, and resume execution perfectly from where it left off.

```python
from langgraph.checkpoint.memory import MemorySaver


# 1. Initialize persistent storage 
#    (Using in-memory storage here. In production, you can replace it with Redis or Postgres)
memory = MemorySaver()


# 2. Compile the graph with the checkpointer
#    This gives the Agent the ability to automatically save and resume state
app_with_memory = workflow.compile(checkpointer=memory)


# 3. Run conversation - Session 1: Introduce yourself
#    In LangGraph, you must specify a thread_id via config to enable persistence
config_bob = {"configurable": {"thread_id": "user_bob_123"}}

print("--- Session 1: Identifying Bob ---")
input_1 = {"messages": [HumanMessage(content="Hi! I'm Bob.")]}
for output in app_with_memory.stream(input_1, config=config_bob, stream_mode="values"):
    last_msg = output["messages"][-1]
    if last_msg.type == "ai":
        print(f"AI: {last_msg.content}")


# 4. Run conversation - Session 2: Ask about the weather
print("\n--- Session 2: Asking Weather ---")
input_2 = {"messages": [HumanMessage(content="What's the weather like in SF?")]}
for output in app_with_memory.stream(input_2, config=config_bob, stream_mode="values"):
    last_msg = output["messages"][-1]
    if last_msg.type == "ai" and last_msg.content:
        print(f"AI: {last_msg.content}")


# 5. Run conversation - Session 3: Verify memory
print("\n--- Session 3: Memory Verification ---")
input_3 = {"messages": [HumanMessage(content="Do you remember what my name is?")]}
for output in app_with_memory.stream(input_3, config=config_bob, stream_mode="values"):
    last_msg = output["messages"][-1]
    if last_msg.type == "ai":
        print(f"AI: {last_msg.content}")

```

```
--- Session 1: Identifying Bob ---
AI: Hello Bob! How can I assist you today?

--- Session 2: Asking Weather ---
AI: The weather in San Francisco is sunny with a temperature of 22°C. Enjoy your day!

--- Session 3: Memory Verification ---
AI: Yes, your name is Bob! How can I assist you further?

```