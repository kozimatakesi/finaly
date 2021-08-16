import React, { useState, useEffect } from 'react';
import {
  Input, Box, Button, Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from '@chakra-ui/react';
import { DropArea } from './DropArea';

const ImportArea = () => {
  const [filePath, setFilePath] = useState('');
  const [fileInfo, setFileInfo] = useState('');

  const handleDrop = async (e) => {
    const item = e.dataTransfer.items[0];
    const entry = item.webkitGetAsEntry();
    if (entry.isFile) {
      setFilePath(e.dataTransfer.files[0].path);
    }
  };

  useEffect(() => {
    api.on('excelInfo', (_, arg) => {
      setFileInfo(arg);
    });
  }, []);

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
      <Table>
        <TableCaption>取得リスト</TableCaption>
        <Thead>
          <Tr>
            <Th>項目</Th>
            <Th>開始時間</Th>
            <Th>終了時間</Th>
          </Tr>
        </Thead>
        <Tbody>
          {
            fileInfo
              ? (
                fileInfo.map((data) => (
                  <Tr key={data.name}>
                    <Td>{data.name}</Td>
                    <Td>{data.start}</Td>
                    <Td>{data.end}</Td>
                  </Tr>
                ))
              ) : <Tr />
          }
        </Tbody>
      </Table>
    </Box>
  );
};

export default ImportArea;
