import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Icon,
  HStack,
  VStack,
  Text,
  Progress,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AttachmentIcon, ChevronUpIcon, ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import { CoinData, SortField, SortOrder, FilterOptions } from '../types/coin';
import { loadCsvData, enrichCoin } from '../utils/coinEnrichment';
import { productHierarchyService } from '../services/productHierarchy';
import { coinScannerService } from '../services/coinScanner';
import { API_URL } from '../config';

const ITEMS_PER_PAGE = 10;

const CoinScanner: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProductDbLoaded, setIsProductDbLoaded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Subscribe to coin changes
    const unsubscribe = coinScannerService.subscribe((newCoins) => {
      setCoins(newCoins);
    });
    // Get initial coins
    setCoins(coinScannerService.getCoins());
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Load product database
      await loadCsvData(file);
      setIsProductDbLoaded(true);
      
      toast({
        title: 'Product database loaded successfully',
        description: 'You can now scan coins',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error loading product database',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const barcodes = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); // Remove empty lines

      if (barcodes.length === 0) {
        throw new Error('No valid barcodes found in the file');
      }

      // Process each barcode
      for (const barcode of barcodes) {
        // Create initial coin data
        const newCoin: CoinData = {
          id: Date.now().toString() + '-' + barcode,
          barcode,
          status: 'pending',
          uploadHistory: [],
        };

        // Add to coins list using the service immediately with quantity
        coinScannerService.addCoin(newCoin, quantity);

        // Start enrichment process in the background
        enrichCoinInBackground(newCoin);
      }

      toast({
        title: 'Barcodes uploaded successfully',
        description: `Processing ${barcodes.length} barcodes`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error processing text file',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enrichCoinInBackground = async (coin: CoinData) => {
    try {
      // Enrich coin data
      const enrichedData = await enrichCoin(coin.barcode);
      
      // Update coin with enriched data using the service
      coinScannerService.updateCoin(coin.id, {
        enrichedData,
        status: 'enriched'
      });

      // Create product hierarchy
      if (enrichedData) {
        const coinId = enrichedData.coinId;
        if (!coinId) {
          throw new Error('No coin ID found in enriched data');
        }
        
        productHierarchyService.addProductHierarchy(
          coinId,
          enrichedData.gradingService || 'Unknown',
          enrichedData
        );
      }
    } catch (error) {
      // Update coin with error status
      coinScannerService.updateCoin(coin.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) {
      toast({
        title: 'Missing required field',
        description: 'Please enter a barcode',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Create initial coin data
    const newCoin: CoinData = {
      id: Date.now().toString(),
      barcode,
      status: 'pending',
      uploadHistory: [],
    };

    // Add to coins list using the service immediately with quantity
    coinScannerService.addCoin(newCoin, quantity);

    // Clear form immediately to allow next scan
    setBarcode('');
    setQuantity(1); // Reset quantity

    // Start enrichment process in the background
    enrichCoinInBackground(newCoin);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedCoins = coins
    .filter(coin => {
      if (filters.status && coin.status !== filters.status) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          coin.barcode.toLowerCase().includes(searchLower) ||
          coin.enrichedData?.coinId?.toLowerCase().includes(searchLower) ||
          coin.enrichedData?.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const sortValueA = sortField === 'id' ? a.barcode : a.status;
      const sortValueB = sortField === 'id' ? b.barcode : b.status;
      
      return sortOrder === 'asc' 
        ? sortValueA.localeCompare(sortValueB)
        : sortValueB.localeCompare(sortValueA);
    });

  const totalPages = Math.ceil(filteredAndSortedCoins.length / ITEMS_PER_PAGE);
  const paginatedCoins = filteredAndSortedCoins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusColor = (status: CoinData['status']) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'enriched': return 'blue';
      case 'uploaded': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const handleDeleteAll = () => {
    coinScannerService.deleteAllCoins();
    setIsDeleteDialogOpen(false);
    toast({
      title: 'All coins removed',
      description: 'All scanned coins have been removed',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Input Section */}
        <Box p={4} borderWidth="1px" borderRadius="lg" bg={bgColor}>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="bold">Coin Scanner</Text>
            {coins.length > 0 && (
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<DeleteIcon />}
                onClick={() => setIsDeleteDialogOpen(true)}
                _hover={{
                  bg: 'red.50',
                  transform: 'translateY(-1px)',
                  boxShadow: 'md',
                }}
                transition="all 0.2s"
              >
                Delete All
              </Button>
            )}
          </HStack>
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
                Scan Coin
              </Button>
            </VStack>
          </form>

          {/* File Upload Section */}
          <Box mt={4} pt={4} borderTop="1px" borderColor={borderColor}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Upload Barcode List (Optional)</FormLabel>
                <HStack>
                  <Input
                    type="file"
                    accept=".txt"
                    onChange={handleTextFileUpload}
                    isDisabled={isLoading}
                    display="none"
                    ref={fileInputRef}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    colorScheme="orange"
                    isLoading={isLoading}
                    leftIcon={<AttachmentIcon />}
                    size="md"
                    width="full"
                    _hover={{
                      transform: 'translateY(-1px)',
                      boxShadow: 'md',
                      bg: 'orange.500',
                      color: 'white'
                    }}
                    _active={{
                      transform: 'translateY(0)',
                      boxShadow: 'sm'
                    }}
                    transition="all 0.2s"
                  >
                    Upload Barcode List
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Upload a text file containing one barcode per line
                </Text>
              </FormControl>
            </VStack>
          </Box>
        </Box>

        {/* Results Table */}
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th cursor="pointer" onClick={() => handleSort('id')}>
                  <HStack>
                    <Text>Barcode</Text>
                    {sortField === 'id' && (
                      <Icon as={sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon} />
                    )}
                  </HStack>
                </Th>
                <Th>Coin ID</Th>
                <Th>Product Name</Th>
                <Th cursor="pointer" onClick={() => handleSort('status')}>
                  <HStack>
                    <Text>Status</Text>
                    {sortField === 'status' && (
                      <Icon as={sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon} />
                    )}
                  </HStack>
                </Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedCoins.map((coin) => (
                <Tr key={coin.id}>
                  <Td>{coin.barcode}</Td>
                  <Td>{coin.enrichedData?.coinId || '-'}</Td>
                  <Td>{coin.enrichedData?.description || '-'}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(coin.status)}>
                      {coin.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCoin(coin);
                          onOpen();
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => {
                          setSelectedCoin(coin);
                          setIsDeleteDialogOpen(true);
                        }}
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

        {/* Pagination */}
        <HStack justify="center" spacing={2}>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            isDisabled={currentPage === 1}
          >
            Previous
          </Button>
          <Text>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            isDisabled={currentPage === totalPages}
          >
            Next
          </Button>
        </HStack>
      </VStack>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete All Coins
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete all scanned coins? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAll} ml={3}>
                Delete All
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
                  <Text>Coin ID: {selectedCoin.enrichedData?.coinId || '-'}</Text>
                  <Text>Status: <Badge colorScheme={getStatusColor(selectedCoin.status)}>{selectedCoin.status}</Badge></Text>
                </Box>

                {selectedCoin.enrichedData && (
                  <Box>
                    <Text fontWeight="bold">Enriched Data</Text>
                    <Text>Year: {selectedCoin.enrichedData.year}</Text>
                    <Text>Denomination: {selectedCoin.enrichedData.denomination}</Text>
                    <Text>Grade: {selectedCoin.enrichedData.grade}</Text>
                    <Text>Description: {selectedCoin.enrichedData.description}</Text>
                    <Text>Quantity: {selectedCoin.enrichedData.quantity}</Text>
                    <Text>Certification Number: {selectedCoin.enrichedData.certificationNumber}</Text>
                    <Text>Grading Service: {selectedCoin.enrichedData.gradingService}</Text>
                    <Text>Type: {selectedCoin.enrichedData.type}</Text>
                    <Text>Mintage: {selectedCoin.enrichedData.mintage}</Text>
                    <Text>Mint Location: {selectedCoin.enrichedData.mintLocation}</Text>
                    <Text>Metal Content: {selectedCoin.enrichedData.metalContent}</Text>
                    <Text>Diameter: {selectedCoin.enrichedData.diameter}</Text>
                    <Text>Weight: {selectedCoin.enrichedData.weight}</Text>
                    <Text>Edge: {selectedCoin.enrichedData.edge}</Text>
                    <Text>Price Guide Value: {selectedCoin.enrichedData.priceGuideValue}</Text>
                    <Text>Population: {selectedCoin.enrichedData.population}</Text>
                    <Text>Designer: {selectedCoin.enrichedData.designer}</Text>
                    {selectedCoin.enrichedData.varieties && (
                      <Text>Varieties: {selectedCoin.enrichedData.varieties.join(', ')}</Text>
                    )}
                  </Box>
                )}

                {selectedCoin.uploadHistory.length > 0 && (
                  <Box>
                    <Text fontWeight="bold">Upload History</Text>
                    {selectedCoin.uploadHistory.map((upload, index) => (
                      <Box key={index} mb={2}>
                        <Text>Timestamp: {upload.timestamp}</Text>
                        <Text>User: {upload.user}</Text>
                      </Box>
                    ))}
                  </Box>
                )}

                {selectedCoin.errorMessage && (
                  <Box>
                    <Text fontWeight="bold" color="red.500">Error</Text>
                    <Text>{selectedCoin.errorMessage}</Text>
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

export default CoinScanner; 