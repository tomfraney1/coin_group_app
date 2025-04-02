import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useColorModeValue,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { DeleteIcon, ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { Case, CaseCoin } from '../types/case';
import { caseService } from '../services/caseService';
import { useParams, useNavigate } from 'react-router-dom';
import { CoinData } from '../types/coin';
import { enrichCoin } from '../utils/coinEnrichment';

const CaseDetails: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CaseCoin | null>(null);
  const [targetCaseId, setTargetCaseId] = useState('');
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [quantity, setQuantity] = useState<number>(1);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (!caseId) return;
    
    const case_ = caseService.getCase(caseId);
    if (!case_) {
      toast({
        title: 'Case not found',
        description: 'The requested case could not be found',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/show-stock/case-management');
      return;
    }
    setCurrentCase(case_);
  }, [caseId, navigate, toast]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !currentCase) return;

    setIsLoading(true);
    try {
      // Enrich coin data
      const enrichedData = await enrichCoin(barcode);
      if (!enrichedData) {
        throw new Error('Failed to enrich coin data');
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Create coin object
      const coin: CaseCoin = {
        id: Date.now().toString(),
        barcode,
        name: enrichedData.description || `${enrichedData.year || ''} ${enrichedData.denomination || ''} ${enrichedData.grade || ''}`.trim() || 'Unknown Coin',
        quantity: quantity
      };

      // Add coin to case
      const updatedCase = caseService.addCoinToCase(currentCase.id, coin, user.username, quantity);
      if (!updatedCase) {
        throw new Error('Failed to add coin to case');
      }

      setCurrentCase(updatedCase);
      setBarcode('');
      setQuantity(1); // Reset quantity after adding
      toast({
        title: 'Coin added',
        description: `Added ${quantity} ${coin.name} to Case ${currentCase.caseNumber}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error adding coin',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCoin = (coinId: string) => {
    if (!currentCase) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    caseService.removeCoinFromCase(currentCase.id, coinId, user.username);
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Coin removed',
      description: 'The coin has been removed from the case',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleMoveCoin = (coinId: string) => {
    if (!currentCase || !targetCaseId) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    caseService.moveCoinBetweenCases(
      currentCase.id,
      targetCaseId,
      coinId,
      user.username
    );
    onClose();
    toast({
      title: 'Coin moved',
      description: 'The coin has been moved to the selected case',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (!currentCase) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="orange.500">
            Case {currentCase.caseNumber}
          </Heading>
          <Badge colorScheme={currentCase.status === 'open' ? 'green' : 'red'}>
            {currentCase.status}
          </Badge>
        </HStack>

        {/* Scanning Interface */}
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <form onSubmit={handleScan}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Scan Coin</FormLabel>
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan coin barcode"
                  autoFocus
                  autoComplete="off"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Enter quantity"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Add Coin
              </Button>
            </VStack>
          </form>
        </Box>

        {/* Coins Table */}
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Barcode</Th>
                <Th>Coin ID</Th>
                <Th>Description</Th>
                <Th>Quantity</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentCase.coins.map((coin) => (
                <Tr key={coin.id}>
                  <Td>{coin.barcode}</Td>
                  <Td>{coin.id}</Td>
                  <Td>{coin.name}</Td>
                  <Td>{coin.quantity}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={() => handleMoveCoin(coin.id)}
                      >
                        Move
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteCoin(coin.id)}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Move Coin Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Move Coin</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <FormControl>
              <FormLabel>Target Case</FormLabel>
              <Select
                value={targetCaseId}
                onChange={(e) => setTargetCaseId(e.target.value)}
                placeholder="Select target case"
              >
                {caseService.getCases()
                  .filter(c => c.id !== currentCase.id && c.status === 'open')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      Case {c.caseNumber}
                    </option>
                  ))}
              </Select>
            </FormControl>
          </ModalBody>
          <Box p={4} pt={0}>
            <Button
              colorScheme="orange"
              onClick={() => selectedCoin && handleMoveCoin(selectedCoin.id)}
              width="100%"
              isDisabled={!targetCaseId}
            >
              Move Coin
            </Button>
          </Box>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Coin
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove this coin from the case? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => selectedCoin && handleDeleteCoin(selectedCoin.id)} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Coin Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            {selectedCoin && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Basic Information</Text>
                  <Text>Barcode: {selectedCoin.barcode}</Text>
                  <Text>Coin ID: {selectedCoin.id}</Text>
                  <Text>Description: {selectedCoin.name}</Text>
                  <Text>Quantity: {selectedCoin.quantity}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CaseDetails; 