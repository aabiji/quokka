# Quokka
A graphing calculator app. The basic mvp would be a basic graph
of a linear equation in a fixed resolution. Why?
- Figure out how Desmos works by building my own basic graphing calculator.
- Learn some more math!
- Make some [cool graphs](https://www.desmos.com/calculator/btezq8hinh)
- Solving and implementing hard technical problems is fun

Implemetation outline:
- Using Typescript
  - Using the DOM directly (no frontend library)
  - Using the Canvas API to render the graph (use WebGL eventually)
- Parser that'll convert our string (or latex) input to a math expression ast
- Evaluator that'll evaluate our ast where it can
- Plotter that'll sample the equation at discrete points and draw lines using those points
- UI to enter expressions and render them in a nice way

- What is Desmos doing?
  - Converting your input into Latex
    - Using library to do the conversion and the rendering
  - Parsing the Latex into an expression tree
  - Symplifying the expression tree (so like plugging in known external variables,
    replacing evaluable expressions with a constant, etc).
    - Converting each node to javascript code for evaluation
  - Sampling the compiled expression at a discrete set of points and using those points
    to form line segments that are then drawn. Using techniques to simplify the plotted graph

Questions:
- How are we parsing and representing the math??
- How are we plotting the math expression?
- How are we solving/evaluating the equations??
  How would we plot a continuous function in a discreet way??
- How are we plotting at different zoom levels??
- Where does GPU acceleration come into play?

Nice to have features:
- What if in our readme we had a screenshot of the app's name being graphed???
  (drawing cursive text using math equations!)
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
