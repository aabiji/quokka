# Quokka

A graphing calculator app. The basic mvp would be a basic graph
of a linear equation in a fixed resolution. Why?
- Figure out how Desmos works by building my own basic graphing calculator.
- Learn some more math!
- Make some [cool graphs](https://www.desmos.com/calculator/btezq8hinh)
- Solving and implementing hard technical problems is fun

Icons taken from [here](https://www.svgrepo.com/collection/font-awesome-solid-icons)

Nice to have features:
- Visualize the graph
    - Make the graph accessible for screen readers
    - Find potential intersection points
      Use MathJax to render our expressions and labels with Latex
- Graph the name of the app (would be a nice blog post)
- Extremely fast and extremely accurate computation
  - Simplify the parse tree better
    - BUG: apparently 2x + 2 isn't something we can we can evalute??
  - GPU acceleration??
  - Only redraw parts of the graph that have changed
- Support diverse expressions:
    - Equations
      - Support equations (ex: y = ...)
      - Actually solving whatever equation there is with x and y.
        It shouldn't be constrained to `y=..` equations. It should
        support stuff like`123 = x + y`. Also support stuff like `f(x) = ...`
    - Absolute value equations
    - Cube root equations
    - Logartihmic equations
    - Inequalities
    - Cosine, sine, tangent
    - Complex values
    - Derivatives and integrals
- ???
    - 3d plotting??
    - Polar coodinates?
