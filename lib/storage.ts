// Persistência de assets no Supabase Storage — upload e URLs públicas

import { createServerSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const BUCKET = 'content-assets'

interface UploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

/** Upload de arquivo para o Supabase Storage */
export async function uploadFile(
  file: File,
  workspaceId: string,
  folder: string = 'documents'
): Promise<UploadResult> {
  try {
    const supabase = createServerSupabaseClient()
    const fileName = `${workspaceId}/${folder}/${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { upsert: false })

    if (error) {
      logger.error('Storage upload failed', { error: error.message, fileName })
      return { success: false, error: error.message }
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path)

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    logger.error('Storage upload error', { error: message })
    return { success: false, error: message }
  }
}

/** Remove arquivo do Supabase Storage */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.storage.from(BUCKET).remove([path])

    if (error) {
      logger.error('Storage delete failed', { error: error.message, path })
      return false
    }
    return true
  } catch (error) {
    logger.error('Storage delete error', {
      error: error instanceof Error ? error.message : 'Unknown',
    })
    return false
  }
}
