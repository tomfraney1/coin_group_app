import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
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
  Badge,
  Icon,
  Heading,
  useColorModeValue,
  Collapse,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import { ProductHierarchy, ProductGrade, ProductSku } from '../types/product';
import { productHierarchyService } from '../services/productHierarchy';

interface TreeNodeProps {
  node: ProductHierarchy | ProductGrade | ProductSku;
  level: number;
  onDelete?: (certificationNumber: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = 'children' in node && node.children.length > 0;
  const isSku = 'certificationNumber' in node;
  const isGrade = 'grade' in node;

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getStatusColor = () => {
    if (isSku) return 'green';
    if (isGrade) return 'blue';
    return 'orange';
  };

  return (
    <Box>
      <HStack
        spacing={2}
        py={2}
        px={4}
        bg={bgColor}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
        cursor={hasChildren ? 'pointer' : 'default'}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        ml={level * 4}
      >
        {hasChildren && (
          <Icon
            as={isOpen ? ChevronDownIcon : ChevronRightIcon}
            boxSize={4}
            color="gray.500"
          />
        )}
        <Text flex={1}>{node.id}</Text>
        <Badge colorScheme={getStatusColor()}>
          {isSku ? 'SKU' : isGrade ? 'Grade' : 'Parent'}
        </Badge>
        {isSku && onDelete && (
          <IconButton
            aria-label="Delete coin"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.certificationNumber);
            }}
            _hover={{
              bg: 'red.100',
              transform: 'scale(1.1)',
            }}
            transition="all 0.2s"
          />
        )}
      </HStack>
      {hasChildren && (
        <Collapse in={isOpen}>
          <Box pl={level * 4 + 4}>
            {node.children.map((child) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
                onDelete={onDelete}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const OMMNIUploader: React.FC = () => {
  const [hierarchies, setHierarchies] = useState<ProductHierarchy[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    // Subscribe to hierarchy changes
    const unsubscribe = productHierarchyService.subscribe((newHierarchies) => {
      setHierarchies(newHierarchies);
    });

    // Get initial hierarchies
    setHierarchies(productHierarchyService.getHierarchies());

    return () => unsubscribe();
  }, []);

  const handleDelete = (certificationNumber: string) => {
    productHierarchyService.deleteProductHierarchy(certificationNumber);
    toast({
      title: 'Coin removed',
      description: 'The coin has been removed from the product hierarchy',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteAll = () => {
    productHierarchyService.deleteAllProductHierarchies();
    setIsDeleteDialogOpen(false);
    toast({
      title: 'All coins removed',
      description: 'All coins have been removed from the product hierarchy',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="orange.500">OMMNI Uploader</Heading>
          {hierarchies.length > 0 && (
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
        
        <Box
          p={6}
          borderWidth={1}
          borderRadius="lg"
          bg={useColorModeValue('white', 'gray.800')}
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold">Product Hierarchy</Text>
            {hierarchies.length === 0 ? (
              <Text color="gray.500">No products available. Scan coins in the Coin Scanner to create the hierarchy.</Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {hierarchies.map((hierarchy) => (
                  <TreeNode 
                    key={hierarchy.id} 
                    node={hierarchy} 
                    level={0} 
                    onDelete={handleDelete}
                  />
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>

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
              Are you sure you want to delete all coins from the product hierarchy? This action cannot be undone.
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
    </Box>
  );
};

export default OMMNIUploader; 