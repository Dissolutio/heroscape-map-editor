import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { MdCloudUpload } from 'react-icons/md';
import React from 'react';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


type Props = {
  mainText: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  startIcon: React.ReactNode
}

export default function InputFileUpload({
  mainText,
  onChange,
  startIcon
}: Props) {
  return (
    <Button
      component="label"
      // biome-ignore lint/a11y/useSemanticElements: <mui example, must be right>
      role="button"
      variant="contained"
      tabIndex={-1}
      startIcon={startIcon}
    >
      {mainText}
      <VisuallyHiddenInput
        type="file"
        onChange={onChange}
        multiple
      />
    </Button>
  );
}