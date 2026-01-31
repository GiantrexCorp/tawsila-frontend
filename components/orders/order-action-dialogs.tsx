"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyInventories,
  fetchCurrentInventory,
  type Inventory,
} from "@/lib/services/inventories";
import { fetchPickupAgents, fetchDeliveryAgents, type Agent } from "@/lib/services/agents";
import type { Order } from "@/lib/services/orders";

interface OrderActionDialogsProps {
  // Selected order for action
  selectedOrder: Order | null;

  // Accept Dialog
  showAcceptDialog: boolean;
  onAcceptDialogClose: () => void;
  onAcceptConfirm: (inventoryId: number) => Promise<void>;
  isAccepting: boolean;

  // Reject Dialog
  showRejectDialog: boolean;
  onRejectDialogClose: () => void;
  onRejectConfirm: (reason?: string) => Promise<void>;
  isRejecting: boolean;

  // Cancel Dialog (for vendors)
  showCancelDialog?: boolean;
  onCancelDialogClose?: () => void;
  onCancelConfirm?: (reason: string) => Promise<void>;
  isCancelling?: boolean;

  // Assign Dialog
  showAssignDialog: boolean;
  onAssignDialogClose: () => void;
  onAssignConfirm: (agentId: number, notes?: string) => Promise<void>;
  isAssigning: boolean;
  assignmentType?: 'pickup' | 'delivery';

  // Translations
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function OrderActionDialogs({
  selectedOrder,
  showAcceptDialog,
  onAcceptDialogClose,
  onAcceptConfirm,
  isAccepting,
  showRejectDialog,
  onRejectDialogClose,
  onRejectConfirm,
  isRejecting,
  showCancelDialog = false,
  onCancelDialogClose,
  onCancelConfirm,
  isCancelling = false,
  showAssignDialog,
  onAssignDialogClose,
  onAssignConfirm,
  isAssigning,
  assignmentType = 'pickup',
  t,
  tCommon,
}: OrderActionDialogsProps) {
  const locale = useLocale();

  // Accept dialog state
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);

  // Reject dialog state
  const [rejectionReason, setRejectionReason] = useState("");

  // Cancel dialog state
  const [cancellationReason, setCancellationReason] = useState("");

  // Assign dialog state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Load inventories when accept dialog opens
  const loadInventories = useCallback(async () => {
    setIsLoadingInventories(true);
    try {
      try {
        const currentInventory = await fetchCurrentInventory();
        setInventories([currentInventory]);
        setSelectedInventoryId(currentInventory.id);
      } catch {
        const myInventories = await fetchMyInventories();
        setInventories(myInventories);
        if (myInventories.length > 0) {
          setSelectedInventoryId(myInventories[0].id);
        }
      }
    } catch {
      toast.error(t("errorLoadingInventories"));
    } finally {
      setIsLoadingInventories(false);
    }
  }, [t]);

  // Load agents when assign dialog opens
  const loadAgents = useCallback(
    async (inventoryId: number, type: 'pickup' | 'delivery') => {
      setIsLoadingAgents(true);
      try {
        const fetchedAgents = type === 'pickup' 
          ? await fetchPickupAgents(inventoryId)
          : await fetchDeliveryAgents(inventoryId);
        setAgents(fetchedAgents);
      } catch {
        toast.error(t("errorLoadingAgents"));
      } finally {
        setIsLoadingAgents(false);
      }
    },
    [t]
  );

  // Effect to load inventories when accept dialog opens
  useEffect(() => {
    if (showAcceptDialog) {
      loadInventories();
    } else {
      setSelectedInventoryId(null);
    }
  }, [showAcceptDialog, loadInventories]);

  // Effect to load agents when assign dialog opens
  useEffect(() => {
    if (showAssignDialog && selectedOrder) {
      const inventoryId =
        selectedOrder.inventory_id || selectedOrder.inventory?.id;
      if (inventoryId) {
        loadAgents(inventoryId, assignmentType);
      }
    } else {
      setSelectedAgentId(null);
      setAssignmentNotes("");
    }
  }, [showAssignDialog, selectedOrder, assignmentType, loadAgents]);

  // Reset rejection reason when dialog closes
  useEffect(() => {
    if (!showRejectDialog) {
      setRejectionReason("");
    }
  }, [showRejectDialog]);

  // Reset cancellation reason when dialog closes
  useEffect(() => {
    if (!showCancelDialog) {
      setCancellationReason("");
    }
  }, [showCancelDialog]);

  const handleAccept = async () => {
    if (!selectedInventoryId) {
      toast.error(t("inventoryRequired"));
      return;
    }
    await onAcceptConfirm(selectedInventoryId);
  };

  const handleReject = async () => {
    await onRejectConfirm(rejectionReason.trim() || undefined);
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error(t("cancellationReason") + " " + t("agentRequired").replace(t("selectAgent"), ""));
      return;
    }
    if (onCancelConfirm) {
      await onCancelConfirm(cancellationReason.trim());
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast.error(t("agentRequired"));
      return;
    }
    await onAssignConfirm(selectedAgentId, assignmentNotes.trim() || undefined);
  };

  return (
    <>
      {/* Accept Order Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={onAcceptDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("acceptOrder")}</DialogTitle>
            <DialogDescription>{t("acceptOrderDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventory">{t("selectInventory")} *</Label>
              {isLoadingInventories ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <Select
                  value={selectedInventoryId?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedInventoryId(parseInt(value))
                  }
                >
                  <SelectTrigger id="inventory">
                    <SelectValue placeholder={t("selectInventoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventories.map((inventory) => (
                      <SelectItem
                        key={inventory.id}
                        value={inventory.id.toString()}
                      >
                        {locale === "ar" && inventory.name_ar
                          ? inventory.name_ar
                          : inventory.name_en || inventory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {inventories.length === 0 && !isLoadingInventories && (
                <p className="text-xs text-destructive">
                  {t("noInventoriesAvailable")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onAcceptDialogClose}
              disabled={isAccepting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isAccepting || !selectedInventoryId || isLoadingInventories}
              className="gap-2"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("accepting")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t("acceptOrder")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Order Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={onRejectDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectOrder")}</DialogTitle>
            <DialogDescription>{t("rejectOrderDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">
                {t("rejectionReason")} ({t("optional")})
              </Label>
              <Textarea
                id="rejection_reason"
                placeholder={t("rejectionReasonPlaceholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t("rejectionReasonHelp")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={onRejectDialogClose}
              disabled={isRejecting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
              className="gap-2"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("rejecting")}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {t("rejectOrder")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog (for vendors) */}
      {showCancelDialog !== undefined && onCancelDialogClose && (
        <Dialog open={showCancelDialog} onOpenChange={onCancelDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("cancelOrder")}</DialogTitle>
              <DialogDescription>{t("cancelOrderDesc")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancellation_reason">
                  {t("cancellationReason")} *
                </Label>
                <Textarea
                  id="cancellation_reason"
                  placeholder={t("cancellationReasonPlaceholder")}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {t("cancellationReasonHelp")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onCancelDialogClose}
                disabled={isCancelling}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling || !cancellationReason.trim()}
                className="gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("cancelling")}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {t("cancelOrder")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Agent Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={onAssignDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignmentType === 'pickup' ? t("assignPickupAgent") : t("assignDeliveryAgent")}
            </DialogTitle>
            <DialogDescription>
              {assignmentType === 'pickup' 
                ? t("assignPickupAgentDesc") 
                : (t("assignDeliveryAgentDesc") || t("assignPickupAgentDesc"))}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent_id">{t("selectAgent")} *</Label>
              {isLoadingAgents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                <Select
                  value={selectedAgentId?.toString() || ""}
                  onValueChange={(value) => setSelectedAgentId(parseInt(value))}
                >
                  <SelectTrigger id="agent_id">
                    <SelectValue placeholder={t("selectAgentPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {locale === "ar" && agent.name_ar
                          ? agent.name_ar
                          : agent.name_en || agent.name}
                        {agent.mobile && ` - ${agent.mobile}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {agents.length === 0 && !isLoadingAgents && (
                <p className="text-xs text-destructive">
                  {t("noAgentsAvailable")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment_notes">
                {t("assignmentNotes")} ({t("optional")})
              </Label>
              <Textarea
                id="assignment_notes"
                placeholder={t("assignmentNotesPlaceholder")}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t("assignmentNotesHelp")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onAssignDialogClose();
                setSelectedAgentId(null);
                setAssignmentNotes("");
              }}
              disabled={isAssigning}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !selectedAgentId}
              className="gap-2"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("assigning")}
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  {assignmentType === 'pickup' ? t("assignPickupAgent") : t("assignDeliveryAgent")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
