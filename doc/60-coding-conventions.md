# **xwterm** - Coding conventions

[Propject Home](https://github.com/giusguerrini/xwterm)

**For contributors**

## Table of Contents
- [Introduction](#introduction)
- [Language](#language)
- [Classes](#classes)
- [Public methods](#public-methods)
- [Private methods](#private-methods)
- [Coding style](#coding-style)
- [Special notes...](#special-notes)

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


<h2 id="special-notes">Special notes...</h2>


### ...for C++ programmers
Dear C++ programmer, everything is under your full control. Resources are allocated and released at your command. You skillfully
apply the RAII idiom to prevent leaks in case of exceptions. Every algorithm is perfectly optimized for the specific instance of
your wisely engineered templates. Smart pointer templates are your powerful weapon against dangling references. You know how to take
advantage of the SFINAE rule to solve even the most convoluted overloading problems. You have mastered the art of managing and converting any
possible implementation of strings: `std::string`, `std::wstring`, `std::u16string`, `boost::string_ref`...; and the platform-dependant ones:
`::BSTR`, `Qt::QString`, `wx::wxString`...
You know how to interpret any compiler error from `std` or `boost`, no matter the nesting level in library's templates.
If you want, you can make an object non-copyable,
non-movable, or even both. You can prevent a derived class from accessing its parent's members. You can also prevent a class from
being derived at all. Recursive templates hold no secrets for you. Your carefully programmed build process eliminates every misalignment
between different compilation units.

You are the zenith of human evolution.

But I have a question for you: WHY?

- Why is the only way to avoid getting screwed by exceptions to collect all resource allocations in constructors?
- Why do you need smart pointers?
- Why do you have convoluted overloading problems?
- Why does a simple spelling error in a parameter of `std` or `boost` methods produce a single, huge error message involving a dozen of
nested templates?
- Why do you need a non-copyable, non-movable object?
- Why should a derived class not access its parent's members?
- Why do you need to recompile all your modules to ensure all binaries are up-to-date?

I'll answer for you.

- You need RAII idiom because you don't actually control resource allocation and descrtuction, but the language puts the
responsibility on you anyway.
- You need smart pointers because language's native pointers are not smart. And their management is on you.
- You have convoluted overloading problems because
  - probably the "advanced" libraries you are using force you to deal with such problems, and
  - you firmly refuse to create a named method if there is any standard operator that vaguely resembles the function. So you "add"
and "subtract" objects to/from collections, "left shift" output streams "by" strings, "multiply" a collection by a filter
predicate function, but also "multiply" the same collection by an integer to make it contain the same objects multiple times. And finally...
  - you love convoluted overloading problems.
- Compilation errors involving standard libraries are huge and unreadable (therefore useless) because these "libraries" are just
headers that the compiler must process every time. This happens because C++ makes the distribution of real precompiled
libraries nearly impossible: you would need the same compiler, the same compilation options and the same environment that were
used to compile the libraries. In short: C++ leaks an ABI. (What? Precompiled headers? Oh, please...).
- You need non-copyable or non-movable objects because, instead of sharing some simple usage rules of your classes, you claim
that the compiler should protect you and your team from errors in logic.
- For the same reason, you want to limit the accessibility of your classes.
- And finally, you need to recompile everything every time because:
  - You can't reliably create precompiled libraries (see above).
  - Public C++ classes, including their private parts, must be declared completely in headers. "Information hiding" principle, where are you?
  - You love `inline` methods; they give you a false feeling of efficiency.
  - Although C++ supports abstract classes and virtual methods to define pure interfaces, from which you
could derive concrete implementations valid only in the minimal necessary context (even C++ has something good), you insist on not using
them because of their alleged poor performances.

Astonishing news: there are programming languages in which things are references. No, not pointers to objects whose lifecycle is
on you. References, with builtin reference counter and automatic cleanup of underlying resources. Even more shocking revelation: there are
languages for whom there is no shuch thing like binary compatibility of modules. Indeed, there are languages in which strings are native types!
Unicode strings, of course.

By the way, you, dear C++ programmer, you are an ardent believer in OOP priciples, right? Everything is an object, with a precise lifecyle.
Also, you diligently apply good coding practices, don't you?
- global, or even static objects are a gift from the devil. Everything must be created at runtime (especially because static constructors
are hopelessly broken in C++).
- Every variable must be a member of a class.
- Methods should be reasonably short and easy-to-read blocks of code.

In your code there are only few local variables, and they are valid only in short internal compounds; the vast majority of symbols
are methods or members, aren't they?

So, why on earth do you put that useless `m_` prefix at the beginning of every member?

### ...for Angular, Electron, React, etc... programmers
You had a difficult childhood and learned early on how harsh life can be. Browsers were unreliable, ready to betray you at the first opportunity.
`this` changed its meaning without any apparent reason. Features upon which you had built your applications were suddenly deprecated and killed.
Even the few things in which you placed your trust - Adobe Flash, Microsoft Silverlight - have abandoned you. 
But you didn't surrender. You worked hard. You fought. And eventually, you made it. Now, you live in a stunning loft on the top floor of a
building. What a wonderful skyline!

You have unlimited power. Dozens of megabytes of open-source code kneel before you, ready to fulfill your every wish. 
You can create an entire portal in just a few lines. There is no convoluted
backend logic, no overly complicated DB report that you can't handle with just a few instructions.

But don't you feel a subtle uneasiness? A hint of dissatisfaction?

Yes, your life is comfortable now, but you are losing the ability to enjoy simple things. Here's some advice for you: leave your loft for just one day and step out onto the street. Experience the simple joy of creating a `<div>`, giving it a name - not an automatically generated one, but a real, unique name: you can't love anything if you haven't given it a name -, seeing it run towards you, wagging his tail, when you call it with `document.getElementById`, changing its text color by tenderly caressing its `style.color` property...


### ...for C programmers
Dear C programmer, I have Good News for you: the Lord is not going to punish you for having duplicated an array, nor for not having sorted it in place. In His infinite mercy, He hasn't even punished those who invented the `cmd.exe` syntax.

Dear C programmer, listen: release the burden of guilt that oppresses you for every single byte you wasted, for every single machine cycle
you added. Managed languages like JavaScript are there to set us free!

Dear C programmer, I am one of you too. I know what lies deep within your soul: the longing for a simple life, filled with small joys. The love for old things, from a time when the world was simple and people knew how a CPU worked. Today nobody cares about
memory and processor usage anymore. But, in the depths of our passionate hearts, we preserve the awareness of how valuable a well-optimized piece of code is. "We few, we happy few, we band of brothers".


