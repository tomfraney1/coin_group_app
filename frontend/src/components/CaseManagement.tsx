import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Badge,
  Grid,
  GridItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useColorModeValue,
  Heading,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ViewIcon } from '@chakra-ui/icons';
import { Case, CaseCoin } from '../types/case';
import { caseService } from '../services/caseService';
import { useNavigate } from 'react-router-dom';

const CaseManagement: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Subscribe to case changes
    const unsubscribe = caseService.subscribe((newCases) => {
      setCases(newCases);
    });
    // Get initial cases
    setCases(caseService.getCases());
    return () => unsubscribe();
  }, []);

  const handleCreateCase = () => {
    if (!newCaseNumber) {
      toast({
        title: 'Missing case number',
        description: 'Please enter a case number',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    caseService.createCase(newCaseNumber, user.username);
    setNewCaseNumber('');
    onClose();
    toast({
      title: 'Case created',
      description: `Case ${newCaseNumber} has been created`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDeleteCase = () => {
    if (!selectedCase) return;
    
    // TODO: Implement case deletion in the service
    setIsDeleteDialogOpen(false);
    toast({
      title: 'Case deleted',
      description: `Case ${selectedCase.caseNumber} has been deleted`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/show-stock/case-management/${caseId}`);
  };

  const getStatusColor = (status: Case['status']) => {
    return status === 'open' ? 'green' : 'red';
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg" color="orange.500">Case Management</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="orange"
            onClick={() => {
              setNewCaseNumber('');
              onOpen();
            }}
          >
            Create New Case
          </Button>
        </HStack>

        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {cases.map((case_) => (
            <GridItem key={case_.id}>
              <Box
                p={6}
                borderWidth={1}
                borderRadius="lg"
                bg={bgColor}
                borderColor={borderColor}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  transition: 'all 0.2s',
                }}
              >
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">
                      Case {case_.caseNumber}
                    </Text>
                    <Badge colorScheme={getStatusColor(case_.status)}>
                      {case_.status}
                    </Badge>
                  </HStack>

                  <Text color="gray.500">
                    Created: {new Date(case_.createdAt).toLocaleDateString()}
                  </Text>

                  <Text>
                    Coins: {case_.coins.length}
                  </Text>

                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      leftIcon={<ViewIcon />}
                      onClick={() => handleViewCase(case_.id)}
                      colorScheme="blue"
                    >
                      View Details
                    </Button>
                    <IconButton
                      aria-label="Edit case"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="yellow"
                      onClick={() => {
                        setSelectedCase(case_);
                        onOpen();
                      }}
                    />
                    <IconButton
                      aria-label="Delete case"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => {
                        setSelectedCase(case_);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  </HStack>
                </VStack>
              </Box>
            </GridItem>
          ))}
        </Grid>
      </VStack>

      {/* Create/Edit Case Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedCase ? 'Edit Case' : 'Create New Case'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <FormControl>
              <FormLabel>Case Number</FormLabel>
              <Input
                value={newCaseNumber}
                onChange={(e) => setNewCaseNumber(e.target.value)}
                placeholder="Enter case number"
              />
            </FormControl>
          </ModalBody>
          <Box p={4} pt={0}>
            <Button
              colorScheme="orange"
              onClick={handleCreateCase}
              width="100%"
            >
              {selectedCase ? 'Update Case' : 'Create Case'}
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
              Delete Case
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete Case {selectedCase?.caseNumber}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteCase} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default CaseManagement; 