import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type InviteCuratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function InviteCuratorModal({ isOpen, onClose }: InviteCuratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setInviteUrl(null);
    setInviteCode(null);
    setCopied(false);
    onClose();
  };

  const handleGenerateCode = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create invite record with just the code
      const { data: invite, error: inviteError } = await supabase
        .from('curator_invites')
        .insert({
          created_by: user.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Generate invite URL
      const inviteLink = `${window.location.origin}/invite?code=${invite.code}`;
      setInviteUrl(inviteLink);
      setInviteCode(invite.code);
    } catch (error) {
      console.error('Error creating invite:', error);
      alert('Failed to create invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
                              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-card shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-semibold text-[#252525]">
                      Generate Invitation Code
                    </Dialog.Title>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {!inviteUrl ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Generate a new invitation code that you can share with anyone. The code will be valid for 30 days.
                      </p>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleGenerateCode}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate Code'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Your invitation code has been generated. Share this code or link with anyone you want to invite:
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Invitation Code
                          </label>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <code className="flex-1 text-lg font-mono font-bold text-[#252525]">
                              {inviteCode}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(inviteCode || '');
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy Code
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Invitation Link
                          </label>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 truncate text-sm">
                              {inviteUrl}
                            </div>
                            <button
                              onClick={copyToClipboard}
                              className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}