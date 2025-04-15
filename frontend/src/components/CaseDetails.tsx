import React, { useState, useEffect, useRef } from 'react';
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
} from '@chakra-ui/react';
import { DeleteIcon, ArrowUpIcon, ArrowDownIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
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
  const [targetCaseId, setTargetCaseId] = useState<string>('');
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [coinId, setCoinId] = useState('');
  const [description, setDescription] = useState('');
  const [scanQueue, setScanQueue] = useState<{ barcode: string; quantity: number }[]>([]);
  const [processingQueue, setProcessingQueue] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [tempCoins, setTempCoins] = useState<{ [key: string]: CaseCoin }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [availableCases, setAvailableCases] = useState<Case[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (caseId) {
      const fetchCaseData = async () => {
        try {
          const [caseData, history] = await Promise.all([
            caseService.getCase(caseId),
            caseService.getCaseHistory(caseId)
          ]);
          setCurrentCase({
            ...caseData,
            history
          });
        } catch (error) {
          console.error('Error fetching case data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load case data',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      };
      fetchCaseData();
    }
  }, [caseId, toast]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const cases = await caseService.getCases();
        setAvailableCases(cases);
      } catch (error) {
        toast({
          title: 'Error loading cases',
          description: error instanceof Error ? error.message : 'Failed to load cases',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      }
    };
    fetchCases();
  }, []);

  // Process the scan queue
  useEffect(() => {
    const processQueue = async () => {
      if (scanQueue.length === 0 || processingQueue) return;

      setProcessingQueue(true);
      const { barcode, quantity } = scanQueue[0];

      try {
        // Add coin to case
        const coin = await caseService.addCoinToCase(currentCase!.id, { barcode, quantity });
        
        // Update the current case with the new coin
        setCurrentCase(prev => {
          if (!prev) return null;
          return {
            ...prev,
            coins: [...prev.coins, coin]
          };
        });

        toast({
          title: 'Coin added',
          description: `Added ${quantity} ${coin.name} to case ${currentCase!.caseNumber}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error adding coin',
          description: error instanceof Error ? error.message : 'Failed to add coin to case',
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      } finally {
        setScanQueue(prev => prev.slice(1));
        setProcessingQueue(false);
      }
    };

    if (currentCase) {
      processQueue();
    }
  }, [scanQueue, currentCase, processingQueue, toast]);

  // Handle barcode input
  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);
  };

  // Handle scan submission
  const handleScanSubmit = async () => {
    if (!currentCase || !barcode) return;
    
    try {
      // Look up coin data in real-time
      const enrichedData = await enrichCoin(barcode);
      
      // Add coin to case with enriched data
      const coin = await caseService.addCoinToCase(currentCase.id, {
        barcode,
        coinId: enrichedData.coinId,
        description: enrichedData.description,
        grade: enrichedData.grade,
        quantity: quantity
      });
      
      // Update the current case with the new coin
      setCurrentCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          coins: [...prev.coins, coin]
        };
      });

      toast({
        title: 'Coin added',
        description: `Added ${quantity} ${enrichedData.description} to case ${currentCase.caseNumber}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      // Clear form for next scan
      setBarcode('');
      setQuantity(1);
      
      // Keep focus on the input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error) {
      toast({
        title: 'Error adding coin',
        description: error instanceof Error ? error.message : 'Failed to add coin to case',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDeleteCoin = async (barcode: string) => {
    if (!currentCase) return;
    
    try {
      await caseService.removeCoinFromCase(currentCase.id, barcode);
      
      // Update the current case by removing the deleted coin
      setCurrentCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          coins: prev.coins.filter(coin => coin.barcode !== barcode)
        };
      });

      toast({
        title: 'Coin removed',
        description: 'The coin has been removed from the case',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error removing coin',
        description: error instanceof Error ? error.message : 'Failed to remove coin from case',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleMoveCoin = async (coinId: string, targetCaseId: string) => {
    toast({
      title: 'Not supported',
      description: 'Moving coins between cases is not supported yet',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleCloseCase = async () => {
    if (!currentCase) return;
    try {
      const updatedCase = await caseService.updateCaseStatus(currentCase.id, 'closed');
      setCurrentCase(updatedCase);
      toast({
        title: 'Case closed',
        description: 'The case has been closed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // Navigate back to case management screen
      navigate('/show-stock/case-management');
    } catch (error) {
      toast({
        title: 'Error closing case',
        description: error instanceof Error ? error.message : 'Failed to close case',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleReopenCase = async () => {
    if (!currentCase) return;
    try {
      const updatedCase = await caseService.updateCaseStatus(currentCase.id, 'open');
      setCurrentCase(updatedCase);
      toast({
        title: 'Case reopened',
        description: 'The case has been reopened',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error reopening case',
        description: error instanceof Error ? error.message : 'Failed to reopen case',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleExportCSV = () => {
    if (!currentCase) return;

    // Create CSV content
    const headers = ['Barcode', 'Coin ID', 'Description', 'Quantity'];
    const rows = currentCase.coins.map(coin => [
      coin.barcode,
      coin.id,
      coin.name,
      coin.quantity.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `case_${currentCase.caseNumber}_export.csv`;
    link.click();
  };

  // Sort history by timestamp in descending order (most recent first)
  const sortedHistory = currentCase ? [...currentCase.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];

  // Calculate pagination
  const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = sortedHistory.slice(startIndex, startIndex + itemsPerPage);

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
          <HStack>
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="blue"
              onClick={handleExportCSV}
              isDisabled={currentCase.coins.length === 0}
            >
              Export CSV
            </Button>
            {currentCase.status === 'open' && (
              <Button
                colorScheme="red"
                onClick={handleCloseCase}
                isDisabled={currentCase.coins.length === 0}
              >
                Close Case
              </Button>
            )}
            {currentCase.status === 'closed' && (
              <Button
                colorScheme="green"
                onClick={handleReopenCase}
              >
                Reopen Case
              </Button>
            )}
            <Badge colorScheme={currentCase.status === 'open' ? 'green' : 'red'}>
              {currentCase.status}
            </Badge>
          </HStack>
        </HStack>

        {/* Scan Form */}
        {currentCase.status === 'open' && (
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            bg={bgColor}
            borderColor={borderColor}
          >
            <Heading size="md" mb={4}>Scan Coin</Heading>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Barcode</FormLabel>
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={handleBarcodeInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleScanSubmit();
                    }
                  }}
                  placeholder="Scan coin barcode"
                  autoFocus
                  autoComplete="off"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(Number(value))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <Button
                colorScheme="blue"
                width="full"
                onClick={handleScanSubmit}
                isLoading={scanQueue.length > 0}
              >
                {scanQueue.length > 0 ? `Processing ${scanQueue.length} coins...` : 'Add Coin'}
              </Button>
              <Text color="gray.500" fontSize="sm">
                {scanQueue.length > 0 ? `Processing ${scanQueue.length} coins...` : 'Ready to scan'}
              </Text>
            </VStack>
          </Box>
        )}

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
                  <Td>{coin.coinId}</Td>
                  <Td>{coin.name}</Td>
                  <Td>{coin.quantity}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        onClick={() => handleMoveCoin(coin.id, targetCaseId)}
                      >
                        Move
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteCoin(coin.barcode)}
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

        {/* Case History Section */}
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>Case History</Heading>
          <Text mb={4} color="gray.500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedHistory.length)} of {sortedHistory.length} entries
          </Text>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Timestamp</Th>
                <Th>Action</Th>
                <Th>User</Th>
                <Th>Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedHistory.map((entry, index) => (
                <Tr key={index}>
                  <Td>{new Date(entry.timestamp).toLocaleString()}</Td>
                  <Td>
                    <Badge colorScheme={
                      entry.action === 'created' ? 'green' :
                      entry.action === 'closed' ? 'red' :
                      entry.action === 'opened' ? 'blue' :
                      entry.action === 'coin_added' ? 'purple' :
                      entry.action === 'coin_removed' ? 'orange' :
                      entry.action === 'coin_moved' ? 'yellow' :
                      entry.action === 'coin_updated' ? 'teal' : 'gray'
                    }>
                      {entry.action.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>{entry.userId}</Td>
                  <Td>{entry.details}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box mt={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text color="gray.500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedHistory.length)} of {sortedHistory.length} entries
                </Text>
                <Text color="gray.500">
                  Page {currentPage} of {totalPages}
                </Text>
              </Flex>
              <Flex justify="center" gap={2}>
                <Button
                  leftIcon={<ChevronLeftIcon />}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <HStack spacing={1}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      colorScheme={currentPage === page ? "blue" : "gray"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </HStack>
                <Button
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </Flex>
            </Box>
          )}
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
                {availableCases
                  .filter(c => c.id !== currentCase?.id && c.status === 'open')
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
              onClick={() => selectedCoin && handleMoveCoin(selectedCoin.id, targetCaseId)}
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
              <Button colorScheme="red" onClick={() => selectedCoin && handleDeleteCoin(selectedCoin.barcode)} ml={3}>
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