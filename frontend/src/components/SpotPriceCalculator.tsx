import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { spotPriceService, SpotPriceProduct } from '../services/spotPriceService';

const SpotPriceCalculator: React.FC = () => {
  const [fixedDollarProducts, setFixedDollarProducts] = useState<SpotPriceProduct[]>([]);
  const [percentageProducts, setPercentageProducts] = useState<SpotPriceProduct[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<SpotPriceProduct, 'id'>>({
    coinId: '',
    metal: 'Silver',
    ounces: 1,
    amount: 0,
    type: 'fixed',
  });
  const [tableType, setTableType] = useState<'fixed' | 'percentage'>('fixed');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const fixedProducts = await spotPriceService.getAllProducts('fixed');
      const percentageProducts = await spotPriceService.getAllProducts('percentage');
      setFixedDollarProducts(fixedProducts);
      setPercentageProducts(percentageProducts);
    } catch (error) {
      toast({
        title: 'Error loading products',
        description: 'Failed to load products from the server',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      const product = await spotPriceService.createProduct({
        ...newProduct,
        type: tableType,
      });
      if (tableType === 'fixed') {
        setFixedDollarProducts([...fixedDollarProducts, product]);
      } else {
        setPercentageProducts([...percentageProducts, product]);
      }
      setNewProduct({
        coinId: '',
        metal: 'Silver',
        ounces: 1,
        amount: 0,
        type: 'fixed',
      });
      onClose();
      toast({
        title: 'Product added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error adding product',
        description: 'Failed to add product to the server',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteProduct = async (id: number, type: 'fixed' | 'percentage') => {
    try {
      await spotPriceService.deleteProduct(id);
      if (type === 'fixed') {
        setFixedDollarProducts(fixedDollarProducts.filter(p => p.id !== id));
      } else {
        setPercentageProducts(percentageProducts.filter(p => p.id !== id));
      }
      toast({
        title: 'Product deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting product',
        description: 'Failed to delete product from the server',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="orange.500">Spot Price Calculator</Heading>

        <HStack spacing={4}>
          <Button
            colorScheme={tableType === 'fixed' ? 'orange' : 'gray'}
            onClick={() => setTableType('fixed')}
          >
            Fixed Dollar Over Spot
          </Button>
          <Button
            colorScheme={tableType === 'percentage' ? 'orange' : 'gray'}
            onClick={() => setTableType('percentage')}
          >
            Percentage Over Spot
          </Button>
        </HStack>

        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={bgColor}
          borderColor={borderColor}
        >
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="bold">
              {tableType === 'fixed' ? 'Fixed Dollar Over Spot' : 'Percentage Over Spot'}
            </Text>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="orange"
              onClick={onOpen}
            >
              Add Product
            </Button>
          </HStack>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Coin ID</Th>
                <Th>Metal</Th>
                <Th>Ounces</Th>
                <Th>{tableType === 'fixed' ? 'Amount ($)' : 'Amount (%)'}</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(tableType === 'fixed' ? fixedDollarProducts : percentageProducts).map((product) => (
                <Tr key={product.id}>
                  <Td>{product.coinId}</Td>
                  <Td>{product.metal}</Td>
                  <Td>{product.ounces}</Td>
                  <Td>{product.amount}</Td>
                  <Td>
                    <Button
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id!, product.type)}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Product</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Coin ID</FormLabel>
                <Input
                  value={newProduct.coinId}
                  onChange={(e) => setNewProduct({ ...newProduct, coinId: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Metal</FormLabel>
                <Select
                  value={newProduct.metal}
                  onChange={(e) => setNewProduct({ ...newProduct, metal: e.target.value as 'Gold' | 'Silver' })}
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Ounces</FormLabel>
                <NumberInput
                  value={newProduct.ounces}
                  onChange={(_, value) => setNewProduct({ ...newProduct, ounces: value })}
                  min={0.1}
                  step={0.1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>{tableType === 'fixed' ? 'Amount ($)' : 'Amount (%)'}</FormLabel>
                <NumberInput
                  value={newProduct.amount}
                  onChange={(_, value) => setNewProduct({ ...newProduct, amount: value })}
                  min={0}
                  step={0.01}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <Button
                colorScheme="orange"
                onClick={handleAddProduct}
                width="full"
              >
                Add Product
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SpotPriceCalculator; 