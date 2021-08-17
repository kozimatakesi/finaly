import React from 'react';
import { Heading, ChakraProvider, Container } from '@chakra-ui/react';
import ImportArea from './ImportArea';

export default function App() {
  return (
    <ChakraProvider>
      <Container>
        <Heading>自動ファイル振り分け君</Heading>
        <ImportArea />
      </Container>
    </ChakraProvider>
  );
}
