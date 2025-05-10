import { Button, Container } from '@mui/material'
import * as pieceSets from '../data/inventories'
import { piecesSoFar } from '../data/pieces'
import { useLocalPieceInventory } from '../hooks/useLocalPieceInventory'

const InventoryForm = () => {
  const {
    addSet,
    removeSet,
    clearPieceInventory,
    pieceInventory,
    // setPieceInventory
  } = useLocalPieceInventory()

  return (
    <div>
      <Container
        sx={{
          padding: 1,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        <Button onClick={() => clearPieceInventory()}>
          Clear Piece Inventory
        </Button>
        <Button onClick={() => addSet(pieceSets.aoa1PieceSet)}>
          Add aoa1PieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.aoa1PieceSet)}>
          Remove aoa1PieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.battleBox1PieceSet)}>
          Add battleBox1PieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.battleBox1PieceSet)}>
          Remove battleBox1PieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.landsPieceSet)}>
          Add landsPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.landsPieceSet)}>
          Remove landsPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.snowsPieceSet)}>
          Add snowsPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.snowsPieceSet)}>
          Remove snowsPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.swampsPieceSet)}>
          Add swampsPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.swampsPieceSet)}>
          Remove swampsPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.watersPieceSet)}>
          Add watersPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.watersPieceSet)}>
          Remove watersPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.laurJunglePieceSet)}>
          Add laurJunglePieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.laurJunglePieceSet)}>
          Remove laurJunglePieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.underdarkPieceSet)}>
          Add underdarkPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.underdarkPieceSet)}>
          Remove underdarkPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.ticallaJunglePieceSet)}>
          Add ticallaJunglePieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.ticallaJunglePieceSet)}>
          Remove ticallaJunglePieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.fortressPieceSet)}>
          Add fortressPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.fortressPieceSet)}>
          Remove fortressPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.marvelPieceSet)}>
          Add marvelPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.marvelPieceSet)}>
          Remove marvelPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.thaelenkPieceSet)}>
          Add thaelenkPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.thaelenkPieceSet)}>
          Remove thaelenkPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.volcarrenPieceSet)}>
          Add volcarrenPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.volcarrenPieceSet)}>
          Remove volcarrenPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.forgottenForestPieceSet)}>
          Add forgottenForestPieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.forgottenForestPieceSet)}>
          Remove forgottenForestPieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.ms2PieceSet)}>
          Add ms2PieceSet
        </Button>
        <Button onClick={() => removeSet(pieceSets.ms2PieceSet)}>
          Remove ms2PieceSet
        </Button>

        <Button onClick={() => addSet(pieceSets.ms1PieceSet)}>
          Add Master Set 1: RoTV
        </Button>
        <Button onClick={() => removeSet(pieceSets.ms1PieceSet)}>
          Remove Master Set 1: RoTV
        </Button>
      </Container>
      {Object.values(piecesSoFar)
        .filter((p) => !p?.isUninventoried)
        .map((piece) => {
          return (
            <li>
              {piece.title}: {pieceInventory[piece.id]}
            </li>
          )
        })}
    </div>
  )
}
// type BasicCardProps = {
//   title: string
//   count: number
// }
// function BasicCard({
//   title,
//   count
// }: BasicCardProps) {
//   return (
//     <Card sx={{ minWidth: 275 }}>
//       <CardContent>
//         <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
//           {title}
//         </Typography>
//         <Typography variant="h5" component="div">
//           {count}
//         </Typography>
//         <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>You have: {count}</Typography>
//       </CardContent>
//       <CardActions>
//         <Button
//           variant='contained'
//           size="small"
//           sx={{ color: 'green' }}
//         >+</Button>
//         <Button
//           variant='contained'
//           size="small"
//           sx={{ color: 'red' }}
//         >-</Button>
//       </CardActions>
//     </Card>
//   );
// }

export default InventoryForm
