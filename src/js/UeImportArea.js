import { Input, Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import { DropArea } from './DropArea';

const UeImportArea = ({ ueData }) => {
  const [dirPath, setDirPath] = useState('');
  const HandleDrop = async (e) => {
    const item = e.dataTransfer.items[0];
    const entry = item.webkitGetAsEntry();
    if (entry.isDirectory) {
      setDirPath(e.dataTransfer.files[0].path);
    }
  };

  return (
    <Box>
      {ueData.carrer}
      _
      {ueData.test}
      _
      {ueData.bandLock}
      <DropArea onDrop={HandleDrop}>
        <Input
          value={dirPath}
          readOnly
        />
      </DropArea>
    </Box>
  );
};

export default UeImportArea;
