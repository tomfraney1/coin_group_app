import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Badge,
  HStack,
  Text,
  Heading,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3001/api/users/${userId}/toggle-active`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      toast({
        title: 'User status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3001/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      toast({
        title: 'User role updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error updating user role',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>User Management</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Username</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Created At</Th>
            <Th>Last Login</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user._id}>
              <Td>{user.username}</Td>
              <Td>{user.email}</Td>
              <Td>
                <HStack spacing={2}>
                  <Badge colorScheme={user.role === 'admin' ? 'red' : 'blue'}>
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                  >
                    Toggle Role
                  </Button>
                </HStack>
              </Td>
              <Td>
                <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Td>
              <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
              <Td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme={user.isActive ? 'red' : 'green'}
                  onClick={() => handleToggleActive(user._id, user.isActive)}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default UserList; 