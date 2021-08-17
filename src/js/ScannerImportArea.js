import { Input, Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import { DropArea } from './DropArea';

const ScannerImportArea = ({ scannerName }) => {
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
      <DropArea onDrop={HandleDrop}>
        {scannerName}
        <Input
          value={dirPath}
          readOnly
        />
      </DropArea>
    </Box>
  );
};

export default ScannerImportArea;
