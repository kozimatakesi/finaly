import React, { useState, useEffect } from 'react';
import { Input, Box, Button } from '@chakra-ui/react';
import { DropArea } from './DropArea';

const ImportArea = () => {
  const [filePath, setFilePath] = useState('');

  const handleDrop = async (e) => {
    const item = e.dataTransfer.items[0];
    const entry = item.webkitGetAsEntry();
    if (entry.isFile) {
      setFilePath(e.dataTransfer.files[0].path);
    }
  };

  return (
    <Box>
      <DropArea onDrop={handleDrop}>
        <Input
          value={filePath}
          readOnly
        />
      </DropArea>
      <Button onClick={() => {
        api.filesApi.readExcelFile(filePath);
      }}
      >
        読み込み

      </Button>
    </Box>
  );
};

export default ImportArea;
