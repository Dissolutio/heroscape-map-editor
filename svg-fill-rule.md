Creating holes within an SVG polygon, or more accurately, an SVG <path> element that defines a polygon, primarily relies on the fill-rule property.
Understanding fill-rule
The fill-rule property determines how the "inside" of a shape is calculated when paths overlap or intersect. There are two main values: 
nonzero (default): This rule determines "insideness" by drawing a ray from a point to infinity and counting how many path segments it crosses. Path segments crossing from left-to-right add 1 to the count, and segments crossing from right-to-left subtract 1. If the final count is zero, the point is outside; otherwise, it's inside. This rule is sensitive to the winding order (clockwise or counter-clockwise) of subpaths. If an inner path has the opposite winding order of its containing path, it will create a hole.
evenodd: This rule determines "insideness" by drawing a ray from a point to infinity and simply counting the number of path segments it crosses. If the count is odd, the point is inside; if even, it's outside. With evenodd, the winding order of the subpaths does not matter; any overlapping area defined by an even number of paths will be transparent.
Making Holes with fill-rule
To create a hole in an SVG polygon (defined as a <path>):
Define the outer shape: Create the main outline of your polygon using path commands (e.g., M for moveto, L for lineto, Z for closepath).
Define the inner shape(s) for the hole(s): Create the path(s) for the area(s) you want to be transparent.
Combine the paths: Concatenate the path data of the outer shape and the inner shape(s) into a single d attribute of a <path> element. Use the M command to move to the starting point of each new subpath.
Apply fill-rule:
Using evenodd: This is often the simplest approach. Set fill-rule="evenodd" on your <path> element. The winding direction of your inner and outer paths does not matter.
Code

        <path d="M10 10 L100 10 L100 100 L10 100 Z M30 30 L30 70 L70 70 L70 30 Z" fill="blue" fill-rule="evenodd" />
In this example, the outer square is filled, and the inner square creates a transparent hole due to evenodd.
Using nonzero: If you use nonzero, you need to ensure the winding direction of the inner path is opposite to the outer path. For example, if the outer path is drawn clockwise, the inner path should be drawn counter-clockwise to create a hole.
Code

        <path d="M10 10 L100 10 L100 100 L10 100 Z M70 30 L70 70 L30 70 L30 30 Z" fill="blue" fill-rule="nonzero" />
Here, the outer square is clockwise, and the inner square is counter-clockwise, resulting in a hole.
Alternative: Using SVG Masks
For more complex scenarios or when you need greater control over transparency, you can use an SVG <mask> element. A mask defines an alpha channel, where white areas in the mask are opaque and black areas are transparent.
Define the mask: Create a <mask> element and define the shapes within it. White shapes in the mask will make the corresponding area of the masked element opaque, while black shapes will make it transparent.
Code

    <mask id="holeMask">
        <rect x="0" y="0" width="100" height="100" fill="white"/>
        <circle cx="50" cy="50" r="20" fill="black"/>
    </mask>
Apply the mask: Reference the mask from the element you want to apply it to using the mask attribute.
Code

    <rect x="0" y="0" width="100" height="100" fill="blue" mask="url(#holeMask)"/>
This example would create a blue rectangle with a circular transparent hole in the center.