import { Dictionary } from 'lodash'
import { Pieces } from '../types'

export const verticalObstructionTemplates: Dictionary<number[]> = {
  /* 
   The order really matters here.
   These number arrays' indices must line up with the templates' indices, as each hex in a terrain model might have a different height.
  */
  [Pieces.ruins2]: [
    // Played with this in virtualscape, and here's how much I think each hex in the template requires for clearance:
    /* Ruins2, 10 on line 2 is the origin for rotation=0
    the X's mark Critical support hexes, these must be supported by solid underneath
    --3--
    9--10x--7x---4
   --10--10x--7--
    */
    // first the basic3 (the support hexes, coincidentally)
    10,
    7, 10,
    // then the bottom-left, top-right, and bottom-right of glacier6
    10, 4, 7,
    // then the short-leg horn & exterior-lee
    3, 9,
  ],
  [Pieces.ruins3]: [
    /* Ruins3
    the X's mark Critical support hexes, these must be supported by solid underneath
    --3--
    9---9x----8x---7---3
    ---9---8x---8---7--
    */
    // first the basic3 (the support hexes, coincidentally)
    9,
    8, 8,
    // then the bottom-left, top-right, and bottom-right of glacier6
    9, 7, 8,
    // then the top-right, and bottom-right hexes
    3, 7,
    // then the short-leg horn & exterior-lee
    3, 9,
  ],
}
export const verticalSupportTemplates: Dictionary<number[]> = {
  /* 
   The order really matters here.
   These number arrays' indices must line up with the templates' indices, much like the verticalObstructionTemplates and implemented shortly after them.
  */
  [Pieces.ruins2]: [
    // Eyeballed this and performed a physical thought experiment remembering all the times I built a map with ruins and how the middle just needed to be supported
    /* Ruins2, 10 on line 2 is the origin for rotation=0
    the X's mark Critical support hexes, these must be supported by solid underneath
    --3--
    9--10x--7x---4
   --10--10x--7--
    */
    // first the basic3 (the support hexes, coincidentally)
    1,
    1, 1,
    // then the rest are not!
    0, 0, 0, 0, 0,
  ],
  [Pieces.ruins3]: [
    /* Ruins3, second 9 on line 2 is the origin for rotation=0
    the X's mark Critical support hexes, these must be supported by solid underneath
    --3--
    9---9x----8x---7---3
    ---9---8x---8---7--
    */
    // so first the basic-3
    // first the basic3 (the support hexes, coincidentally)
    1,
    1, 1,
    // then the rest are not!
    0, 0, 0, 0, 0, 0, 0,
  ],
}
export const interiorHexTemplates: Dictionary<number[]> = {
  /* 
  THESE ARE BROKEN AND DO NOT SOLVE THE PROBLEM OF PERFECT VALID RUIN PLACEMENT: Edges need to be explored, they are different than hexes
  */
  [Pieces.ruins2]: [
    /* the i's mark the interior hexes
    --3--
    9--10i--7i---4
   --10--10--7--
    */
    // A value of "2"  means origin, "1" means auxiliary
    // first the basic3, which contains both of ruins2's interior hexes
    2,
    1, 0,
    // then the rest are not!
    0, 0, 0, 0, 0,
  ],
  [Pieces.ruins3]: [
    /* the i's mark the interior hexes
    --3--
    9---9i----8i---7i---3
    ---9---8---8---7--
    */
    // A value of "2"  means origin, "1" means auxiliary
    // first the basic3, which contains 2 of ruins3's interior hexes
    2,
    1, 0,
    // then the bottom-left, top-right, and bottom-right (top-right is our last interior hex)
    0,
    1, 0,
    // then the rest are not!
    0, 0, 0, 0,
  ],
}
