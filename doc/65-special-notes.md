# **xwterm** - Special notes

[Project Home](https://github.com/giusguerrini/xwterm)

**For contributors**

## Table of Contents
- [Introduction](#introduction)
- [To C++ Programmes](#cplusplus)
- [To Angular, React, Vue etc. Programmes](#frameworks)
- [To C Programmes](#plainc)

<h2 id="Introduction">Introduction</h2>

This is a collection of irrational thoughts about the alleged "top technologies" of software development. It is composed of
some "open letters" to devotees of some of the most commonly used programming languages. Don't take them too seriously.
Just read and enjoy (if you haven't been made blind by anger yet - but if you have, I'd suggest you meditate on "why" you felt angry).

<h2 id="cplusplus">To C++ Programmers</h2>
Dear C++ programmer, everything is under your full control. Resources are allocated and released at your command. You skillfully
apply the RAII idiom to prevent leaks in case of exceptions. Every algorithm is perfectly optimized for the specific instance of
your wisely engineered templates. Smart pointer templates are your powerful weapon against dangling references. You know how to take
advantage of the SFINAE rule to solve even the most convoluted overloading problems. You have mastered the art of managing and converting any
possible implementation of strings: `std::string`, `std::wstring`, `std::u16string`, `boost::string_ref`...; and the platform-dependent ones:
`::BSTR`, `Qt::QString`, `wx::wxString`...
You know how to interpret any compiler error from `std` or `boost`, no matter the nesting level in the libraries' templates.
If you want, you can make an object non-copyable,
non-movable, or even both. You can prevent a derived class from accessing its parent's members. You can also prevent a class from
being derived at all. Recursive templates hold no secrets for you. Your carefully programmed build process eliminates every misalignment
between different compilation units.

You are the zenith of human evolution.

But I have a question for you: WHY?

- Why is the only way to avoid getting screwed by exceptions to collect all resource allocations in constructors?
- Why do you need smart pointers?
- Why do you have convoluted overloading problems?
- Why does a simple spelling error in a parameter of `std` or `boost` methods produce a single, huge error message involving a dozen
nested templates?
- Why do you need a non-copyable, non-movable object?
- Why should a derived class not access its parent's members?
- Why do you need to recompile all your modules to ensure all binaries are up to date?

I'll answer for you.

- You need the RAII idiom because you don't actually control resource allocation and destruction, but the language puts the
responsibility on you anyway.
- You need smart pointers because the language's native pointers are not smart, and their management is on you.
- You have convoluted overloading problems because
  - probably the "advanced" libraries you are using force you to deal with such problems, and
  - you firmly refuse to create a named method if there is any standard operator that vaguely resembles the function. So you "add"
and "subtract" objects to and from collections, "left shift" output streams "by" strings, "multiply" a collection by a filter
predicate function, but also "multiply" the same collection by an integer to make it contain the same objects multiple times. And finally...
  - you love convoluted overloading problems.
- Compilation errors involving standard libraries are huge and unreadable (therefore useless) because these "libraries" are just
headers that the compiler must process every time. This happens because C++ makes the distribution of real precompiled
libraries nearly impossible: you would need the same compiler, the same compilation options, and the same environment that were
used to compile the libraries. In short: C++ leaks an ABI. (What? Precompiled headers? Oh, please...).
- You need non-copyable or non-movable objects because
  - your usual habit is copying or moving objects, regardless of their size and complexity, rather than moving or copying references.
"Non-copying" and "non-moving" seem odd to you, so you feel the need to devise special expedients to highlight these cases.
  - you do have pointers (even "smart" ones), but you prefer to declare single instances of objects whenever possible. That's why
you also love that sort of fake references with ampersands, which I'd rather call "aliases".
  - instead of sharing some simple usage rules for your classes, you claim that the compiler should protect you and your team from errors in logic.
  - you love convoluted language problems in general.
- For the same reasons, you want to limit the accessibility of your classes.
- And finally, you need to recompile everything every time because:
  - You can't reliably create precompiled libraries (see above).
  - Public C++ classes, including their private parts, must be declared completely in headers. "Information hiding" principle, where are you?
  - You love `inline` methods; they give you a false feeling of efficiency.
  - Although C++ supports abstract classes and virtual methods to define pure interfaces from which you
could derive concrete implementations valid only in the minimal necessary context (even C++ has something good), you insist on not using
them because of their alleged poor performance.

Astonishing news: there are programming languages in which things are references. No, not pointers to objects whose lifecycle is
on you. References, with a built-in reference counter and automatic cleanup of underlying resources. Even more shocking revelation: there are
languages for which there is no such thing as binary compatibility of modules. Indeed, there are languages in which strings are native types!
Unicode strings, of course.

By the way, you, dear C++ programmer, are an ardent believer in OOP principles, right? Everything is an object, with a precise lifecycle.
Also, you diligently apply good coding practices, don't you?
- Global, or even static, objects are a gift from the devil. Everything must be created at runtime (especially because static constructors
are hopelessly broken in C++).
- Every variable must be a member of a class.
- Methods should be reasonably short and easy-to-read blocks of code.

In your code there are only a few local variables, and they are valid only in short internal compounds; the vast majority of symbols
are methods or members, aren't they?

So, why on earth do you put that useless `m_` prefix at the beginning of every member?

<h2 id="frameworks">To Angular, React, Vue etc. Programmers</h2>
### ...for Angular, Electron, React, etc... programmers
You had a difficult childhood and learned early on how harsh life can be. Browsers were unreliable, ready to betray you at the first opportunity.
The `this` keyword changed its meaning without any apparent reason. Features upon which you had built your applications were suddenly deprecated and killed.
Even the few things in which you placed your trust - Adobe Flash, Microsoft Silverlight - have abandoned you.
But you didn't surrender. You worked hard. You fought. And eventually, you made it. Now, you live in a stunning loft on the top floor of a
building. What a wonderful skyline!

You have unlimited power. Dozens of megabytes of open-source code kneel before you, ready to fulfill your every wish.
You can create an entire portal in just a few lines. There is no convoluted
backend logic, no overly complicated DB report that you can't handle with just a few instructions.

But don't you feel a subtle uneasiness? A hint of dissatisfaction?

Yes, your life is comfortable now, but you are losing the ability to enjoy simple things. Here's some advice for you: leave your loft for just one day and step out onto the street. Experience the simple joy of creating a `<div>`, giving it a name - not an automatically generated one, but a real, unique name: you can't love anything if you haven't given it a name -, seeing it run towards you, wagging its tail when you call it with `document.getElementById`, changing its text color by tenderly caressing its `style.color` property...


<h2 id="plainc">To C Programmers</h2>
Dear C programmer, I have good news for you: the Lord is not going to punish you for having duplicated an array, nor for not having sorted it in place. In His infinite mercy, He hasn't even punished those who invented the `cmd.exe` syntax.

Dear C programmer, listen: release the burden of guilt that oppresses you for every single byte you wasted, for every single machine cycle
you added. Managed languages like JavaScript are there to set us free!

Dear C programmer, I am one of you too. I know what lies deep within your soul: the longing for a simple life, filled with small joys. The love for old things, from a time when the world was simple and people knew how a CPU worked. Today nobody cares about
memory and processor usage anymore. But, in the depths of our passionate hearts, we preserve the awareness of how valuable a well-optimized piece of code is. "We few, we happy few, we band of brothers".

