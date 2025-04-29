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
  Progress,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { Case, CaseCoin, StockTakeResult } from '../types/case';
import { caseService } from '../services/caseService';
import { enrichCoin } from '../utils/coinEnrichment';
import { DeleteIcon } from '@chakra-ui/icons';

const StockTake: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedCoins, setScannedCoins] = useState<{ [key: string]: { quantity: number; timestamp: number } }>({});
  const [notes, setNotes] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StockTakeResult | null>(null);
  const [historicalResults, setHistoricalResults] = useState<StockTakeResult[]>([]);
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
    caseService.getCases().then(cases => {
      setCases(cases);
    }).catch(error => {
      toast({
        title: 'Error loading cases',
        description: error instanceof Error ? error.message : 'Failed to load cases',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      // Load historical results for the selected case
      caseService.getStockTakeResults()
        .then(results => {
          const filteredResults = results.filter((r: StockTakeResult) => r.caseId === selectedCase.id);
          setHistoricalResults(filteredResults);
        })
        .catch(error => {
          toast({
            title: 'Error loading historical results',
            description: error instanceof Error ? error.message : 'Failed to load historical results',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [selectedCase]);

  const handleCaseSelect = (caseId: string) => {
    console.log('Case selected:', caseId);
    console.log('Available cases:', cases);
    const selectedCase = cases.find(c => c.id.toString() === caseId);
    console.log('Found case:', selectedCase);
    if (!selectedCase) {
      console.log('Case not found');
      return;
    }

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

      // Update scanned count with timestamp
      setScannedCoins(prev => ({
        ...prev,
        [coin.id]: {
          quantity: (prev[coin.id]?.quantity || 0) + 1,
          timestamp: now
        }
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

  const handleQuantityChange = (coinId: string, newQuantity: number) => {
    setScannedCoins(prev => ({
      ...prev,
      [coinId]: {
        ...prev[coinId],
        quantity: newQuantity
      }
    }));
  };

  const handleRemoveScan = (coinId: string) => {
    setScannedCoins(prev => {
      const newScannedCoins = { ...prev };
      delete newScannedCoins[coinId];
      return newScannedCoins;
    });
  };

  const handleSubmitStockTake = () => {
    if (!selectedCase) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const discrepancies = selectedCase.coins.map(coin => ({
      coinId: coin.id,
      expected: coin.quantity,
      actual: scannedCoins[coin.id]?.quantity || 0
    })).filter(disc => disc.expected !== disc.actual);

    const result: StockTakeResult = {
      id: Date.now().toString(),
      caseId: selectedCase.id,
      performedAt: new Date().toISOString(),
      performedBy: user.username,
      discrepancies,
      notes
    };

    caseService.addStockTakeResult(result)
      .then(() => {
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
      })
      .catch(error => {
        toast({
          title: 'Error submitting stock take',
          description: error instanceof Error ? error.message : 'Failed to submit stock take',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleExportCSV = () => {
    if (!selectedCase) return;

    const headers = ['Barcode', 'Coin ID', 'Description', 'Expected Quantity', 'Actual Quantity', 'Status'];
    const rows = selectedCase.coins.map(coin => {
      const scannedQuantity = scannedCoins[coin.id]?.quantity || 0;
      const status = scannedQuantity === coin.quantity ? 'Match' : 'Discrepancy';
      return [
        coin.barcode,
        coin.coinId,
        coin.name,
        coin.quantity,
        scannedQuantity,
        status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_take_case_${selectedCase.caseNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProgress = () => {
    if (!selectedCase) return 0;
    const totalCoins = selectedCase.coins.length;
    const scannedCoinsCount = Object.keys(scannedCoins).length;
    return (scannedCoinsCount / totalCoins) * 100;
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

              {/* Progress Bar */}
              <Box>
                <Text mb={2}>Progress: {Math.round(getProgress())}%</Text>
                <Progress value={getProgress()} colorScheme="green" size="sm" />
              </Box>

              {/* Updated Scanning Interface */}
              <form onSubmit={handleScan}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Scan Coins</FormLabel>
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyPress={(e) => {
                        // Auto-submit when common barcode scanner terminators are detected
                        if (['Enter', 'Tab', ' '].includes(e.key)) {
                          e.preventDefault(); // Prevent default behavior of the key
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
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {selectedCase.coins.map((coin) => {
                    const scannedQuantity = scannedCoins[coin.id]?.quantity || 0;
                    const isScanned = scannedQuantity > 0;
                    return (
                      <Tr key={coin.id} bg={isScanned ? 'green.50' : 'red.50'}>
                        <Td>{coin.barcode}</Td>
                        <Td>{coin.name}</Td>
                        <Td>{coin.quantity}</Td>
                        <Td>
                          <NumberInput
                            min={0}
                            value={scannedQuantity}
                            onChange={(value) => handleQuantityChange(coin.id, Number(value))}
                            size="sm"
                            width="100px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getDiscrepancyColor(coin.quantity, scannedQuantity)}
                          >
                            {coin.quantity === scannedQuantity ? 'Match' : 'Discrepancy'}
                          </Badge>
                        </Td>
                        <Td>
                          <Tooltip label="Remove scan">
                            <IconButton
                              aria-label="Remove scan"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleRemoveScan(coin.id)}
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    );
                  })}
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

              <HStack spacing={4}>
                <Button
                  colorScheme="orange"
                  onClick={handleSubmitStockTake}
                  size="lg"
                  isDisabled={Object.keys(scannedCoins).length === 0}
                >
                  Submit Stock Take
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleExportCSV}
                  size="lg"
                >
                  Export to CSV
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Historical Results */}
        {selectedCase && (
          <Box
            p={6}
            borderWidth={1}
            borderRadius="lg"
            bg={bgColor}
            borderColor={borderColor}
          >
            <VStack spacing={4} align="stretch">
              <Heading size="md">Historical Stock Takes</Heading>
              {historicalResults.length > 0 ? (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Performed By</Th>
                      <Th>Discrepancies</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {historicalResults.map((result) => (
                      <Tr key={result.id}>
                        <Td>{new Date(result.performedAt).toLocaleString()}</Td>
                        <Td>{result.performedBy}</Td>
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
              ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                  No historical stock takes found for this case
                </Text>
              )}
            </VStack>
          </Box>
        )}
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
                    <HStack justify="space-between" mb={4}>
                      <Text fontWeight="bold">Discrepancies</Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => {
                          const headers = ['Barcode', 'Expected', 'Actual'];
                          const rows = selectedResult.discrepancies.map((disc) => {
                            const coin = selectedCase?.coins.find(c => c.id === disc.coinId);
                            return [
                              coin?.barcode,
                              disc.expected,
                              disc.actual
                            ];
                          });

                          const csvContent = [
                            headers.join(','),
                            ...rows.map(row => row.join(','))
                          ].join('\n');

                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          link.setAttribute('download', `stock_take_discrepancies_${new Date(selectedResult.performedAt).toISOString().split('T')[0]}.csv`);
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download Discrepancies CSV
                      </Button>
                    </HStack>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Barcode</Th>
                          <Th>Expected</Th>
                          <Th>Actual</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedResult.discrepancies.map((disc) => {
                          const coin = selectedCase?.coins.find(c => c.id === disc.coinId);
                          return (
                            <Tr key={disc.coinId}>
                              <Td>{coin?.barcode}</Td>
                              <Td>{disc.expected}</Td>
                              <Td>{disc.actual}</Td>
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
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StockTake; 