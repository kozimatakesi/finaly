import { Input } from '@chakra-ui/input';
import { Box } from '@chakra-ui/layout';
import React, { useState } from 'react';
import { DropArea } from './DropArea';

const DirImportArea = () => {
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
        <Input
          value={dirPath}
        />
      </DropArea>
    </Box>
  );
};

export default DirImportArea;
