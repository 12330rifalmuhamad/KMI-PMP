'use client'

import { useState, useEffect } from 'react'

import {
  Modal,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'

const CreateColumnModal = ({ open, onClose, onColumnCreated, boardId, initialType = 'TEXT' }) => {
  const [columnName, setColumnName] = useState('')
  const [columnType, setColumnType] = useState(initialType)

  // Update tipe kolom jika initialType berubah (saat modal dibuka kembali)
  useEffect(() => {
    setColumnType(initialType)
  }, [initialType])

  const handleCreate = async () => {
    if (!columnName.trim()) return
    await onColumnCreated({ txtColumnName: columnName, txtColumnType: columnType })
    setColumnName('')
    setColumnType('TEXT') // Reset ke default setelah dibuat
    // onClose(); // OnClose akan dipanggil oleh onColumnCreated jika sukses
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Card className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-backgroundPaper p-4'>
        <CardContent className='flex flex-col gap-4'>
          <Typography variant='h6'>Add New Column</Typography>
          <TextField label='Column Name' value={columnName} onChange={e => setColumnName(e.target.value)} autoFocus />
          <FormControl fullWidth>
            <InputLabel>Column Type</InputLabel>
            <Select value={columnType} label='Column Type' onChange={e => setColumnType(e.target.value)}>
              {/* Pastikan opsi ini sesuai dengan yang ada di menu Anda */}
              <MenuItem value={'TEXT'}>Text</MenuItem>
              <MenuItem value={'STATUS'}>Status</MenuItem>
              <MenuItem value={'PERSON'}>People</MenuItem>
              <MenuItem value={'DATE'}>Date</MenuItem>
              <MenuItem value={'NUMBER'}>Numbers</MenuItem>
              <MenuItem value={'CHECKBOX'}>Checkbox</MenuItem>
              <MenuItem value={'FILES'}>Files</MenuItem>
              <MenuItem value={'DROPDOWN'}>Dropdown</MenuItem>
              <MenuItem value={'TIMELINE'}>Timeline</MenuItem>
              <MenuItem value={'FORMULA'}>Formula</MenuItem>
              {/* Tambahkan tipe lain sesuai kebutuhan */}
            </Select>
          </FormControl>
          <div className='flex justify-end gap-2'>
            <Button variant='outlined' color='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleCreate}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>
    </Modal>
  )
}

export default CreateColumnModal
