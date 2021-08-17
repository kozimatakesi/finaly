import React, { useState, useEffect } from 'react';
import {
  Input, Box, Button, Table, Text,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
} from '@chakra-ui/react';
import { DropArea } from './DropArea';
import ScannerImportArea from './ScannerImportArea';

const ImportArea = () => {
  const [filePath, setFilePath] = useState('日誌EXCELファイルをここにドロップ');
  const [fileInfo, setFileInfo] = useState('');
  /*
  if (fileInfo) {
    fileInfo.scanner.forEach((_, index) => {
      const valName = `scannerPath${index}`;
      const functionName = `setScannerPath${index}`;
      const [valName, functionName] = useState('');
    });
  }
  */
  // excelファイル用
  const excelHandleDrop = async (e) => {
    const item = e.dataTransfer.items[0];
    const entry = item.webkitGetAsEntry();
    if (entry.isFile) {
      setFilePath(e.dataTransfer.files[0].path);
    }
  };

  useEffect(() => {
    api.on('excelInfo', (_, arg) => {
      setFileInfo(arg);
      console.log(fileInfo);
    });
  }, []);

  return (
    <Box>
      <DropArea onDrop={excelHandleDrop}>
        <Input
          value={filePath}
          readOnly
        />
      </DropArea>

      {
        filePath !== '日誌EXCELファイルをここにドロップ'
          ? (
            <Button onClick={() => {
              api.filesApi.readExcelFile(filePath);
            }}
            >
              読み込み
            </Button>
          ) : <Text>日誌ファイルをドロップしてください</Text>
      }
      <Text mt={2}>
        ◯測定日 :
        {fileInfo ? fileInfo.date : ''}
      </Text>
      <Text mt={2}>
        ◯測定案件 :
        {fileInfo ? fileInfo.sb : ''}
      </Text>
      <Text mt={2}>
        ◯測定内容 :
        {fileInfo ? fileInfo.means : ''}
      </Text>
      <Text mt={2}>
        ◯測定エリア :
        {fileInfo ? fileInfo.area : ''}
      </Text>
      <Text mt={2}>◯Anritsu</Text>
      <Box>
        {
            fileInfo
              ? (
                fileInfo.scanner.map((data) => (
                  <ScannerImportArea scannerName={data} key={data} />
                ))

              ) : ''
          }
      </Box>
      <Text mt={2}>◯測定端末</Text>
      <Box>
        {
            fileInfo
              ? (
                fileInfo.ue.map((data) => (
                  <Box key={data.number}>
                    {data.carrer}
                    _
                    {data.test}
                    _
                    {data.bandLock}
                    <Input />
                  </Box>
                ))

              ) : ''
          }
      </Box>
      <Text mt={2}>◯測定エリア毎ログ時間</Text>
      <Table size="sm">
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
                fileInfo.time.map((data) => (
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
