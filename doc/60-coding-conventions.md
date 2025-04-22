# **xwterm** - Coding conventions
**For contributors**

## Table of Contents
- [Introduction](#introduction)
- [Language](#language)
- [Classes](#classes)
- [Public methods](#public-methods)
- [Private methods](#private-methods)
- [Coding style](#coding-style)

<h2 id="Introduction">Introduction</h2>

In this section I will describe the coding rules used in **xwterm**.

In general, I am not an enthusiast of rigid coding rules, especially those that were not invented by me. However,
there are some simple, widely known conventions that I have decided to adopt in this project.
Contributors are encouraged to adhere to them - unless doing so distracts from adding new, smart, and innovative features.

<h2 id="language">Language</h2>

Since the primary targets of this project are modern browsers, we can assume that JavaScript ES6 syntax is supported.
I recommend applying basic OOP principles (e.g., classes and simple inheritance) while avoiding the proliferation of
small classes that perform only trivial operations.

For callbacks (e.g., deferred actions, group operations, timeouts...), I suggest using the new syntax `() =>`, which
eliminates headaches when used within methods.

Constants, when needed, should be written in UPPERCASE. Where to place a constant (e.g., global scope or class local
scope) depends on the meaning of the symbol and individual preference.

<h2 id="classes">Classes</h2>

Class names are **PascalCase**.
As mentioned above, classes should be "big enough." I do not recommend splitting the program into microscopic
classes that contain only a few fields and elementary methods. A JavaScript dictionary is often a better and
more readable choice.

<h2 id="public-methods">Public methods</h2>

Method and members intendended to be public are **camelCase**.

<h2 id="private-methods">Private methods</h2>

Although modern JavaScript implements private methods, for the sake of compatibility I prefer not to use them.
In this project, methods that are intended to be private are prefixed by an underscore.
This rule does not apply to non-function members whose intended scope is "private". Plain lowercase
identifiers are preferred for them.

<h2 id="coding-style">Coding style</h2>

As mentioned above, I am not a fan of rigid, abstract coding conventions. The purpose of coding conventions should
be readability, because while writing code is hard, reading it is even harder.

I have often encountered long and detailed "coding manuals" from corporate Quality Departments.
These manuals tend to focus on trivial formalities, failing miserably at making the source code clean and understandable.

I understand that this is a matter of personal taste, but in my experience, some so-called "best practices" make
code worse. For example: unnecessary prefixes and descriptive identifiers that fail to actually clarify anything.
Let's consider this fragment of code:

```javascript
	for (iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere = 0;
	     iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere < fArrayOfThingsIAmLookingFor.length;
	     ++iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere) {

		if (fArrayOfThingsIAmLookingFor[iIndexOfTheThingIAmLookingForButIAmNotSureIfItIsThere]
		 == fTheThingIAmLookingForButIAmNotSureIfItIsThere) {
			break;
		}
	}
```

Some QAs would consider this a "conformat code". Any questions?

Today's screens are wide, but, please, just use a plain "i" for index. Please.

Beside my personal quirks, I'll impose at least two rules:
- Always put semicolons at the end of statements: do not rely on JavaScript's inconsistent handling of EOL.  
- Always use braces for control structures: do not rely on your focus when adding the second line
of a conditional.




