# Graphing calculator

TODO: figure out the tech stack -- what do I want to work with for several months??
      choose a name
      break down the project into smaller subprojects
      prelimenary research -- how is this going to work??

Tech stack?
- typescript, webgl, webassembly
- rust, webassembly
- c++, raylib -- wasm compiled (think aobut writing a preprocessor so I don't have to touch header files)

Potential names:
graph-lauren, graphcalc

**Basic MVP**: Graphing a linear equation in the browser
Why??
- Figure out how Desmos works by building my own basic graphing calculator.
- Learn some more math!
- Make some [cool graphs](https://www.desmos.com/calculator/btezq8hinh)
- Solving and implementing hard technical problems is fun

Questions:
- How are we parsing and representing the math??
- How are we plotting the math expression?
- How are we solving/evaluating the equations??
  How would we plot a continuous function in a discreet way??
- How are we plotting at different zoom levels??
- Where does GPU acceleration come into play?

Nice to have features:
- What if in our readme we had a screenshot of the app's name being graphed???
- Extremely fast and extremely accurate computation
- Support diverse equations:
    - Quadratic and cubic equations
    - Absolute value equations
    - Reciprocal equations
    - Cube root equations
    - Logartihmic equations
    - Inequalities
    - Cosine, sine, tangent
    - Derivatives and integrals
    - Complex values
    - * Actually solving whatever equation there is with x and y.
      It shouldn't be constrained to `y=..` equations. It should
      support stuff like`123 = x + y`. Also support stuff like `f(x) = ...`
    - Generally just support graphing some of the cool graphs mentioned above.
      What if we could plot the mandlebrot set??
- Visualize the graph
    - Rendering the actual points in a fast and pleasing way
    - Zoom in and out and panning around
    - Find potential intersection points
    - A basic ui for the different equations
    - Render the equations in a nice way (maybe using latex or something like that???/)
- ???
    - 3d
    - Polar system graphs?