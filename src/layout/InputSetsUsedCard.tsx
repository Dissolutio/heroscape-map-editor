import { CardActions, CardContent, Collapse, IconButton, type IconButtonProps, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import useBoundStore from '../store/store'
import { terrainSetsByShortID } from '../data/terrainSets'
import { FcExpand } from 'react-icons/fc'
import { countStringInArrayLoop, getSetsUsedText } from '../utils/map-utils'

export const setsUsedInputNameForFormData = 'terrainSet'
type Props = {
  isCreateNewMap?: boolean
}
export function InputSetsUsedCard({
  isCreateNewMap
}: Props) {
  const hexMap = useBoundStore((state) => state.hexMap)
  const setsUsed = hexMap?.setsUsed ?? []
  const setsUsedText = getSetsUsedText(hexMap?.setsUsed ?? [])
  const [isSetUsedOpen, setIsSetUsedOpen] = React.useState(false)
  const toggleIsSetsUsedOpen = () => {
    setIsSetUsedOpen(!isSetUsedOpen)
  }
  // const { isSmallScreenWidth, isMediumScreenWidth } = useMuiMediaQuery()
  // const fontSizeHeaderMapName =
  //   isSmallScreenWidth && setsUsedText > 32
  //     ? '0.6em'
  //     : isSmallScreenWidth
  //       ? '0.9em'
  //       : hexMap.name.length > 32
  //         ? '0.8em'
  //         : '1em'


  return (
    <Card
      sx={{ backgroundColor: 'transparent', border: '1px solid var(--sub-white)' }}
    >
      <CardContent
        sx={{ backgroundColor: 'transparent' }}
      >
        <Button onClick={toggleIsSetsUsedOpen}>
          Add terrain set constraints:
        </Button>
        {!isCreateNewMap && <Typography
          variant="subtitle1"
          component="span"
          title="Terrain sets used for this map"
          noWrap
          sx={{
            flexGrow: 1,
            textAlign: 'left',
            // fontSize: `calc(${fontSizeHeaderMapName} * 0.7)`,
            color: 'var(--sub-white)',
            px: 2,
            overflow: 'hidden',
            maxHeight: 68,
          }}
        >
          {setsUsedText}
        </Typography>}
        <Collapse in={isSetUsedOpen} timeout="auto" unmountOnExit>
          {Object.values(terrainSetsByShortID).map((set) => (
            <TextField
              key={set.id}
              variant="outlined"
              margin="dense"
              defaultValue={isCreateNewMap ? 0 : countStringInArrayLoop(setsUsed, set.id)}
              slotProps={{
                htmlInput: { min: 0 }
              }}
              color={!isCreateNewMap && countStringInArrayLoop(setsUsed, set.id) > 0 ? 'success' : undefined}
              focused
              name={`${setsUsedInputNameForFormData}${set.id}`}
              label={`${set.name} - ${set.abbreviation}`}
              title={`${set.name} - ${set.abbreviation}`}
              type="number"
            />
          ))}
        </Collapse >
      </CardContent>
      <CardActions disableSpacing>
        <ExpandMore
          expand={isSetUsedOpen}
          onClick={toggleIsSetsUsedOpen}
          aria-expanded={isSetUsedOpen}
          aria-label="show more"
        >
          <FcExpand />
        </ExpandMore>
      </CardActions>
    </Card >
  );
}





interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

export const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme }) => ({
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
  variants: [
    {
      props: ({ expand }) => !expand,
      style: {
        transform: 'rotate(0deg)',
      },
    },
    {
      props: ({ expand }) => !!expand,
      style: {
        transform: 'rotate(180deg)',
      },
    },
  ],
}));
