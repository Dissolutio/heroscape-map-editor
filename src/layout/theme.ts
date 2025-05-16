import type { Dictionary } from 'lodash'

export const hexoscapeColors = {
  white: '#f7edf0',
  gray: '#A09AAC',
  grayUrlEncoded: '%235d576b',
  // player colors
  beeYellow: '#E0BB00',
  jasmine: '#B86BDB',
  beeYellowUrlEncoded: '%23E0BB00',
  butterflyPurple: '#fc65b8',
  butterflyPurpleUrlEncoded: '%23fc65b8',
  waspGreen: '#09E85E',
  waspGreenUrlEncoded: '%2309E85E',
  beetleBlue: '#058ed9',
  beetleBlueUrlEncoded: '%23058ed9',
  hummingbirdGreen: '#75DBCD',
  hummingbirdGreenUrlEncoded: '%2375DBCD',
  lavendarFloral: '#B86BDB',
  lavendarFloralUrlEncoded: '%23E8AA14',
}

export const hexoscapePlayerColors: Dictionary<string> = {
  '': hexoscapeColors.white,
  '0': hexoscapeColors.beeYellow,
  '1': hexoscapeColors.butterflyPurple,
  '2': hexoscapeColors.waspGreen,
  '3': hexoscapeColors.beetleBlue,
  '4': hexoscapeColors.hummingbirdGreen,
  '5': hexoscapeColors.lavendarFloral,
}
