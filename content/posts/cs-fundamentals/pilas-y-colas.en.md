---
title: 'Stacks and Queues'
metaTitle: 'Mastering Stacks and Queues in Data Structures'
metaDescription: 'Explore stacks and queues, their properties, operations, and applications in computer science. Learn to implement them in Python!'
slug: 'pilas-y-colas'
publishedAt: '2026-04-20'
updatedAt: '2026-04-20'
idioma: 'en'
categoryTitle: 'CS Fundamentals'
authors:
  - juan-carlos-angulo
semantic_keywords:
  - data structures
  - LIFO
  - FIFO
  - algorithms
  - Python implementation
  - function calls
  - expression evaluation
tldr: 'Discover the fundamentals of stacks and queues, their core operations, use cases, and how to implement them effectively in Python.'
---

# Understanding Stacks and Queues: Fundamental Data Structures in Computer Science

*By Juan Carlos Angulo, Senior Tech SEO & Software Engineer*

In programming and computer science, understanding data structures is fundamental. Two of the most commonly used linear data structures are **Stacks** and **Queues**. Despite their apparent simplicity, they serve as foundational building blocks not only for algorithms but also for complex data manipulations. This article aims to provide an in-depth look at these structures, their properties, differences, applications, and implementations.

## What Are Stacks?

### Definition and Properties

A **Stack** is a collection of elements that follows a particular order for operations. The principle that defines a Stack is referred to as **LIFO** (Last In, First Out). This means that the last element added to the stack will be the first one to be removed.

For example, think of a stack of plates. You can only take the top plate off the stack (LIFO), and you can only add a new plate on top.

### Common Operations

The primary operations associated with stacks are:

- **Push**: Adds an element to the top of the stack.
- **Pop**: Removes the top element from the stack.
- **Peek**: Returns the top element without removing it.
- **IsEmpty**: Checks if the stack is empty.

### Use Cases

Stacks are utilized in a variety of applications including:

- **Function call management**: The execution context and local variables are often managed using stacks.
- **Undo mechanisms**: In applications like text editors, stacks are used to keep track of changes so that they can be undone.
- **Expression evaluation**: Stacks facilitate the conversion from infix to postfix expressions, as seen in compilers.

## Implementing a Stack

### Stack Implementation in Python

Let's explore a basic implementation of a stack in Python using a list:

```python
class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        if not self.is_empty():
            return self.items.pop()
        raise IndexError("pop from empty stack")
    
    def peek(self):
        if not self.is_empty():
            return self.items[-1]
        raise IndexError("peek from empty stack")
    
    def is_empty(self):
        return len(self.items) == 0

# Example usage
stack = Stack()
stack.push(1)
stack.push(2)
print(stack.peek())  # Output: 2
stack.pop()
print(stack.peek())  # Output: 1
```

## What Are Queues?

### Definition and Properties

A **Queue** is another collection of elements, but it differs in its operational order: it follows the **FIFO** (First In, First Out) principle. The first element added to the queue will be the first one to be removed.

Imagine a line of people waiting to enter a theater. The first person in line is the first to enter; hence, it operates on a FIFO basis.

### Common Operations

Queues support a set of primary operations:

- **Enqueue**: Adds an element at the back of the queue.
- **Dequeue**: Removes the front element from the queue.
- **Front**: Returns the front element without removing it.
- **IsEmpty**: Checks if the queue is empty.

### Use Cases

Queues are employed in many scenarios, such as:

- **Scheduling processes**: In operating systems, queues manage processes waiting for execution or resources.
- **Breadth-First Search (BFS)**: In graph algorithms, queues help traverse nodes level by level.
- **Print job management**: In printers, queues manage multiple print jobs effectively.

## Implementing a Queue

### Queue Implementation in Python

Here is a straightforward implementation of a queue in Python using a list:

```python
class Queue:
    def __init__(self):
        self.items = []
    
    def enqueue(self, item):
        self.items.append(item)
    
    def dequeue(self):
        if not self.is_empty():
            return self.items.pop(0)
        raise IndexError("dequeue from empty queue")
    
    def front(self):
        if not self.is_empty():
            return self.items[0]
        raise IndexError("front from empty queue")
    
    def is_empty(self):
        return len(self.items) == 0

# Example usage
queue = Queue()
queue.enqueue(1)
queue.enqueue(2)
print(queue.front())  # Output: 1
queue.dequeue()
print(queue.front())  # Output: 2
```

## Key Differences Between Stacks and Queues

While both stacks and queues are linear data structures, their core operational logic and intended applications significantly differ:

| Feature                | Stack                     | Queue                    |
|------------------------|---------------------------|--------------------------|
| Ordering               | LIFO                      | FIFO                     |
| Primary Operations      | Push, Pop, Peek

## See Also

- [Data Structures: An Overview and Their Applications](https://juan-tech.com/en/blog/cs-fundamentals/data-structures)
- [Algorithms and Data Structures 2026: The Engineer's Foundation](https://juan-tech.com/en/blog/cs-fundamentals/algoritmos-estructuras-datos)
- [Recursion Algorithms](https://juan-tech.com/en/blog/cs-fundamentals/recursividad)
