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
  useColorModeValue,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
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
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { Case, CaseCoin, StockTakeResult } from '../types/case';
import { caseService } from '../services/caseService';
import { enrichCoin } from '../utils/coinEnrichment';

const StockTake: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedCoins, setScannedCoins] = useState<{ [key: string]: number }>({});
  const [notes, setNotes] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StockTakeResult | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Add new state for handling continuous scanning
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const SCAN_DELAY = 500; // Minimum delay between scans in milliseconds

  useEffect(() => {
    // Subscribe to case changes
    const unsubscribe = caseService.subscribe((newCases) => {
      setCases(newCases);
    });
    // Get initial cases
    setCases(caseService.getCases());
    return () => unsubscribe();
  }, []);

  const handleCaseSelect = (caseId: string) => {
    const selectedCase = cases.find(c => c.id === caseId);
    if (!selectedCase) return;

    setSelectedCase(selectedCase);
    setScannedCoins({});
    setNotes('');
    setBarcode('');
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !selectedCase) return;

    // Prevent duplicate scans within the delay period
    const now = Date.now();
    if (now - lastScanTime < SCAN_DELAY) {
      return;
    }
    setLastScanTime(now);

    setIsLoading(true);
    try {
      // Find the coin in the selected case
      const coin = selectedCase.coins.find(c => c.barcode === barcode);
      if (!coin) {
        toast({
          title: 'Coin not found',
          description: 'This coin is not in the selected case',
          status: 'warning',
          duration: 2000,
          isClosable: true,
        });
        setBarcode('');
        return;
      }

      // Update scanned count
      setScannedCoins(prev => ({
        ...prev,
        [coin.id]: (prev[coin.id] || 0) + 1
      }));

      // Show a quick success toast
      toast({
        title: 'Coin counted',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });

      // Clear the input immediately for next scan
      setBarcode('');
    } catch (error) {
      toast({
        title: 'Error scanning coin',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStockTake = () => {
    if (!selectedCase) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const discrepancies = selectedCase.coins.map(coin => ({
      coinId: coin.id,
      expected: 1, // Expected count is always 1
      actual: scannedCoins[coin.id] || 0
    })).filter(disc => disc.expected !== disc.actual);

    const result: StockTakeResult = {
      id: Date.now().toString(),
      caseId: selectedCase.id,
      performedAt: new Date().toISOString(),
      performedBy: user.username,
      discrepancies,
      notes
    };

    caseService.addStockTakeResult(result);
    toast({
      title: 'Stock take completed',
      description: `Stock take for Case ${selectedCase.caseNumber} has been completed`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    // Reset form
    setSelectedCase(null);
    setScannedCoins({});
    setNotes('');
    setBarcode('');
  };

  const handleDeleteResult = () => {
    if (!selectedResult) return;

    // TODO: Implement result deletion in the service
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Result deleted',
      description: 'The stock take result has been deleted',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const getDiscrepancyColor = (expected: number, actual: number) => {
    if (expected === actual) return 'green';
    if (actual < expected) return 'red';
    return 'yellow';
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="orange.500">Stock Take</Heading>

        {/* Case Selection */}
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <FormControl>
            <FormLabel>Select Case</FormLabel>
            <Select
              placeholder="Select a case"
              onChange={(e) => handleCaseSelect(e.target.value)}
            >
              {cases.map((case_) => (
                <option key={case_.id} value={case_.id}>
                  Case {case_.caseNumber} ({case_.coins.length} coins)
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Stock Take Form */}
        {selectedCase && (
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            bg={bgColor}
            borderColor={borderColor}
          >
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">
                  Case {selectedCase.caseNumber}
                </Text>
                <Badge colorScheme={selectedCase.status === 'open' ? 'green' : 'red'}>
                  {selectedCase.status}
                </Badge>
              </HStack>

              {/* Updated Scanning Interface */}
              <form onSubmit={handleScan}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Scan Coins</FormLabel>
                    <Input
                      value={barcode}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBarcode(value);
                        // Auto-submit when barcode is complete (assuming barcodes are a fixed length)
                        if (value.length >= 10) { // Adjust this length based on your barcode format
                          handleScan(e as any);
                        }
                      }}
                      placeholder="Scan coin barcode"
                      autoFocus
                      autoComplete="off"
                    />
                  </FormControl>
                </VStack>
              </form>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Barcode</Th>
                    <Th>Name</Th>
                    <Th>Expected</Th>
                    <Th>Scanned</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {selectedCase.coins.map((coin) => (
                    <Tr key={coin.id}>
                      <Td>{coin.barcode}</Td>
                      <Td>{coin.name}</Td>
                      <Td>1</Td>
                      <Td>{scannedCoins[coin.id] || 0}</Td>
                      <Td>
                        <Badge
                          colorScheme={getDiscrepancyColor(1, scannedCoins[coin.id] || 0)}
                        >
                          {1 === (scannedCoins[coin.id] || 0) ? 'Match' : 'Discrepancy'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the stock take"
                  rows={3}
                />
              </FormControl>

              <Button
                colorScheme="orange"
                onClick={handleSubmitStockTake}
                size="lg"
                isDisabled={Object.keys(scannedCoins).length === 0}
              >
                Submit Stock Take
              </Button>
            </VStack>
          </Box>
        )}

        {/* Recent Results */}
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <VStack spacing={4} align="stretch">
            <Heading size="md">Recent Stock Takes</Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Case</Th>
                  <Th>Performed By</Th>
                  <Th>Date</Th>
                  <Th>Discrepancies</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {caseService.getStockTakeResults().map((result) => (
                  <Tr key={result.id}>
                    <Td>Case {cases.find(c => c.id === result.caseId)?.caseNumber}</Td>
                    <Td>{result.performedBy}</Td>
                    <Td>{new Date(result.performedAt).toLocaleString()}</Td>
                    <Td>
                      <Badge colorScheme={result.discrepancies.length === 0 ? 'green' : 'red'}>
                        {result.discrepancies.length} discrepancies
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedResult(result);
                          onOpen();
                        }}
                      >
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </VStack>
        </Box>
      </VStack>

      {/* Result Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Stock Take Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            {selectedResult && (
              <VStack spacing={4} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontWeight="bold">Case</Text>
                    <Text>Case {cases.find(c => c.id === selectedResult.caseId)?.caseNumber}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Performed By</Text>
                    <Text>{selectedResult.performedBy}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Date</Text>
                    <Text>{new Date(selectedResult.performedAt).toLocaleString()}</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontWeight="bold">Discrepancies</Text>
                    <Text>{selectedResult.discrepancies.length}</Text>
                  </GridItem>
                </Grid>

                {selectedResult.notes && (
                  <Box>
                    <Text fontWeight="bold">Notes</Text>
                    <Text>{selectedResult.notes}</Text>
                  </Box>
                )}

                {selectedResult.discrepancies.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Discrepancy Details</Text>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Coin</Th>
                          <Th>Expected</Th>
                          <Th>Actual</Th>
                          <Th>Difference</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedResult.discrepancies.map((disc) => {
                          const coin = cases
                            .find(c => c.id === selectedResult.caseId)
                            ?.coins.find(coin => coin.id === disc.coinId);
                          return (
                            <Tr key={disc.coinId}>
                              <Td>{coin?.name || 'Unknown'}</Td>
                              <Td>{disc.expected}</Td>
                              <Td>{disc.actual}</Td>
                              <Td>
                                <Badge colorScheme={disc.actual < disc.expected ? 'red' : 'yellow'}>
                                  {disc.actual - disc.expected}
                                </Badge>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <Box p={4} pt={0}>
            <Button
              colorScheme="red"
              onClick={() => {
                setSelectedResult(selectedResult);
                setIsDeleteDialogOpen(true);
                onClose();
              }}
              width="100%"
            >
              Delete Result
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
              Delete Stock Take Result
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this stock take result? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteResult} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default StockTake; 