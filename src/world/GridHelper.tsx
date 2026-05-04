import { Vector3 } from 'three'
import { HEXGRID_HEX_HEIGHT } from '../utils/constants'

const GridHelper = () => {
  // cellSize: { value: 0.6, min: 0, max: 10, step: 0.1 },
  // cellThickness: { value: 1, min: 0, max: 5, step: 0.1 },
  // cellColor: '#6f6f6f',
  // sectionSize: { value: 3.3, min: 0, max: 10, step: 0.1 },
  // sectionThickness: { value: 1.5, min: 0, max: 5, step: 0.1 },
  // sectionColor: '#9d4b4b',
  // fadeDistance: { value: 25, min: 0, max: 100, step: 1 },
  // fadeStrength: { value: 1, min: 0, max: 1, step: 0.1 },
  // followCamera: false,
  // infiniteGrid: true
  return (
    <group>
      <AxesLevelHelper />
      {/* {(new Array(10).fill(0)).map((_, i) => (
                <Grid
                    // scale={[10, HEXGRID_HEX_HEIGHT, 10]}
                    position={new Vector3(0, HEXGRID_HEX_HEIGHT * i, 0)}
                    args={[10, 10, 10, 10]}
                    sectionSize={1}
                    sectionThickness={5}
                    cellSize={1}
                    cellThickness={5}
                    sectionColor={'#e30000'}
                    side={2}
                //  ={[10.5, 10.5]}
                />
            ))} */}
    </group>
  )
}
const AxesLevelHelper = () => {
  return (
    <group>
      {new Array(20).fill(0).map((_, i) => (
        <axesHelper
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={i}
          scale={[10, HEXGRID_HEX_HEIGHT, 10]}
          position={new Vector3(0, HEXGRID_HEX_HEIGHT * i, 0)}
        />
      ))}
    </group>
  )
}

export default GridHelper
