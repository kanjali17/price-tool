import type { EquipmentCatalogItem } from './equipmentData'

export const excelOutdoor: EquipmentCatalogItem[] = [
  { model: 'RELQ72 - 120', description: 'Heat Recovery VRV - 1 Module (Aurora - 575V)', cfmSize: 'RELQ72 - 120' },
  { model: 'RELQ144 - 240', description: 'Heat Recovery VRV - 2 Modules (Aurora - 575V)', cfmSize: 'RELQ144 - 240' },
  { model: 'REYQ72 - 168', description: 'Heat Recovery VRV - 1 Module (208-230V ,460V ,575V)', cfmSize: 'REYQ72 - 168' },
  { model: 'REYQ192 - 336', description: 'Heat Recovery VRV - 2 Modules (208-230V ,460V ,575V)', cfmSize: 'REYQ192 - 336' },
  { model: 'REYQ360 - 456', description: 'Heat Recovery VRV - 3 Modules (208-230V ,460V ,575V)', cfmSize: 'REYQ360 - 456' },
  { model: 'RXYQ72 - 168', description: 'Heat Pump VRV - 1 Module (208-230V ,460V ,575V)', cfmSize: 'RXYQ72 - 168' },
  { model: 'RXLQ72 - 120', description: 'Heat Pump VRV - 1 Module (Aurora - 575V)', cfmSize: 'RXLQ72 - 120' },
  { model: 'RXLQ144 - 240', description: 'Heat Pump VRV - 2 Modules (Aurora - 575V)', cfmSize: 'RXLQ144 - 240' },
  { model: 'RXYQ192 - 336', description: 'Heat Pump VRV - 2 Modules (208-230V ,460V ,575V)', cfmSize: 'RXYQ192 - 336' },
  { model: 'RXYQ360 - 408', description: 'Heat Pump VRV - 3 Modules (208-230V ,460V ,575V)', cfmSize: 'RXYQ360 - 408' },
  { model: 'RXTQ36 - 60', description: 'Heat Pump VRV-S (208-230V/1ph)', cfmSize: 'RXTQ36-60,RXYMQ36-48,RMXS48' },
  { model: 'RXYMQ36 - 48', description: 'Heat Pump VRV-III-S (208-230V/1ph)', cfmSize: 'RXTQ36-60,RXYMQ36-48,RMXS48' },
]

export const excelBranch: EquipmentCatalogItem[] = [
  { model: 'BSQ36TVJ/BSVQ36', description: 'Branch Selector Unit - Single Port', category: 'BSQ36' },
  { model: 'BSQ60TVJ/BSVQ60', description: 'Branch Selector Unit - Single Port', category: 'BSQ60' },
  { model: 'BSQ96TVJ/BSVQ96', description: 'Branch Selector Unit - Single Port', category: 'BSQ96' },
  { model: 'BS4Q54TVJ/BSV4Q36', description: 'Branch Selector Unit - 4 Port', category: 'BSV4Q54' },
  { model: 'BS6Q54TVJ/BSV6Q36', description: 'Branch Selector Unit - 6 Port', category: 'BSV6Q54' },
  { model: 'BS8Q54TVJ', description: 'Branch Selector Unit - 8 Port', category: 'BSV8Q54' },
  { model: 'BS10Q54TVJ', description: 'Branch Selector Unit - 10 Port', category: 'BSV10Q54' },
  { model: 'BS12Q54TVJ', description: 'Branch Selector Unit - 12 Port', category: 'BSV12Q54' },
  { model: 'BSF4Q54TVJ', description: 'Flex Branch Selector Unit - 4 Port', category: 'BSF4Q54' },
  { model: 'BSF6Q54TVJ', description: 'Flex Branch Selector Unit - 6 Port', category: 'BSF6Q54' },
  { model: 'BSF8Q54TVJ', description: 'Flex Branch Selector Unit - 8 Port', category: 'BSF8Q54' },
]

export const excelIndoor: EquipmentCatalogItem[] = [
  { model: 'FXAQ07 - 15', description: 'Wall Mounted Unit' },
  { model: 'FXAQ18 - 24', description: 'Wall Mounted Unit' },
  { model: 'FXDQ07 - 15', description: 'Slim Duct Concealed (Ducted)', isDucted: true },
  { model: 'FXDQ18 - 24', description: 'Slim Duct Concealed (Ducted)', isDucted: true },
  { model: 'FXDQ07 - 15(Limited)', description: 'Slim Duct Concealed (Limited Ducted/Hotel App)', isDucted: true },
  { model: 'FXDQ18 - 24(Limited)', description: 'Slim Duct Concealed (Limited Ducted/Hotel App)', isDucted: true },
  { model: 'FXEQ07 - 15', description: 'One Way Blow Cassette Unit' },
  { model: 'FXEQ18 - 24', description: 'One Way Blow Cassette Unit' },
  { model: 'FXFQ07 - 15', description: 'Round Flow Cassette' },
  { model: 'FXFQ18 - 24', description: 'Round Flow Cassette' },
  { model: 'FXFQ30 - 36', description: 'Round Flow Cassette' },
  { model: 'FXFQ42 - 48', description: 'Round Flow Cassette' },
  { model: 'FXHQ12 - 15', description: 'Ceiling Suspended Unit' },
  { model: 'FXHQ18 - 24', description: 'Ceiling Suspended Unit' },
  { model: 'FXHQ30 - 36', description: 'Ceiling Suspended Unit' },
  { model: 'FXLQ07 - 15', description: 'Floor Standing Unit' },
  { model: 'FXLQ18 - 24', description: 'Floor Standing Unit' },
  { model: 'FXMQ07 - 15', description: 'DC Ducted Concealed Unit', isDucted: true },
  { model: 'FXMQ18 - 24', description: 'DC Ducted Concealed Unit', isDucted: true },
  { model: 'FXMQ30 - 36', description: 'DC Ducted Concealed Unit', isDucted: true },
  { model: 'FXMQ42 - 48', description: 'DC Ducted Concealed Unit', isDucted: true },
  { model: 'FXMQ54 - 72', description: 'DC Ducted Concealed Unit / Concealed Ceiling Unit', isDucted: true },
  { model: 'FXMQ96', description: 'Concealed Ceiling Unit', cfmSize: '96', isDucted: true },
  { model: 'FXMQ48MF', description: '100% Outside Air Processing Unit', isDucted: true },
  { model: 'FXMQ72MF', description: '100% Outside Air Processing Unit', isDucted: true },
  { model: 'FXMQ96MF', description: '100% Outside Air Processing Unit', cfmSize: '96', isDucted: true },
  { model: 'FXNQ07 - 15', description: 'Concealed Floor Standing Unit' },
  { model: 'FXNQ18 - 24', description: 'Concealed Floor Standing Unit' },
  { model: 'FXSQ05 - 15', description: 'MSP Concealed Ducted Unit', isDucted: true },
  { model: 'FXSQ18 - 24', description: 'MSP Concealed Ducted Unit', isDucted: true },
  { model: 'FXSQ30 - 36', description: 'MSP Concealed Ducted Unit', isDucted: true },
  { model: 'FXSQ42 - 48', description: 'MSP Concealed Ducted Unit', isDucted: true },
  { model: 'FXSQ54 - 60', description: 'MSP Concealed Ducted Unit', isDucted: true },
  { model: 'FXTQ12 - 15', description: 'Vertical/Multi-Position Air Handling Unit (Ducted)', isDucted: true },
  { model: 'FXTQ18 - 24', description: 'Vertical/Multi-Position Air Handling Unit (Ducted)', isDucted: true },
  { model: 'FXTQ30 - 36', description: 'Vertical/Multi-Position Air Handling Unit (Ducted)', isDucted: true },
  { model: 'FXTQ42 - 48', description: 'Vertical/Multi-Position Air Handling Unit (Ducted)', isDucted: true },
  { model: 'FXTQ54 - 60', description: 'Vertical/Multi-Position Air Handling Unit (Ducted)', isDucted: true },
  { model: 'FXUQ18 - 24', description: '4-Way Blow Ceiling-Suspended' },
  { model: 'FXUQ30 - 36', description: '4-Way Blow Ceiling-Suspended' },
  { model: 'FXZQ07 - 15', description: '4-Way Ceiling Cassette 2\' x 2\'' },
  { model: 'FXZQ18', description: '4-Way Ceiling Cassette 2\' x 2\'' },
  { model: 'VAM300 - 470', description: 'Energy Recovery Unit (Ducted)', isDucted: true },
  { model: 'VAM600', description: 'Energy Recovery Unit (Ducted)', isDucted: true },
  { model: 'VAM1200', description: 'Energy Recovery Unit (Ducted)', isDucted: true },
]

export const excelRefnet: EquipmentCatalogItem[] = [
  { model: 'KHRP25', description: 'REFNET Branch Piping Kit (3 Pipe)', category: 'KHRP25' },
  { model: 'KHRP25---H9', description: 'REFNET Header (3 Pipe)', category: 'KHRP25-H9' },
  { model: 'KHRP26', description: 'REFNET Branch Piping Kit (2 Pipe)', category: 'KHRP26' },
  { model: 'KHRP26---H9', description: 'REFNET Header (2 Pipe)', category: 'KHRP26-H9' },
  { model: 'BHFP26P90 - 151U', description: 'Condensing Unit Multi Connection Piping Kit (HR)', category: 'BHFP26P90' },
  { model: 'BHFP22P100U/151U', description: 'Condensing Unit Multi Connection Piping Kit (HP)', category: 'BHFP22P100' },
]

export const excelRefrigerant: EquipmentCatalogItem[] = [
  { model: 'R410A', description: 'REFRIGERANT(Pounds)', tooltip: 'Enter pounds of R410A' },
]

export const excelControllers: EquipmentCatalogItem[] = [
  { model: 'BRC1E73/BRC1E52A7', description: 'Navigation Controller' },
  { model: 'BRC2A71', description: 'Simplfied' },
  { model: 'DCS601C71', description: 'I-Touch' },
  { model: 'DCM601A71', description: 'I-Touch Manager' },
  { model: 'BACNet Interface', description: 'BACNet Interface' },
  { model: 'I Touch WEB', description: 'I Touch WEB' },
]

