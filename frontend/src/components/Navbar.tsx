import React from 'react';
import { Box, Flex, HStack, Heading, Button, useToast } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    navigate('/login');
  };

  return (
    <Box as="nav" bg="gray.100" borderBottom="1px" borderColor="gray.200">
      <Flex h={16} alignItems="center" justifyContent="space-between" px={4}>
        <HStack spacing={8}>
          <Link to="/">
            <Heading size="md">Coin Group App</Heading>
          </Link>
          <HStack spacing={4}>
            <Link to="/">Scan Coins</Link>
            <Link to="/inventory">Location Dashboard</Link>
            <Link to="/show-stock">Show Stock</Link>
            <Link to="/users">Users</Link>
          </HStack>
        </HStack>
        <Button
          colorScheme="orange"
          variant="outline"
          onClick={handleLogout}
          size="sm"
        >
          Logout
        </Button>
      </Flex>
    </Box>
  );
};

export default Navbar; 