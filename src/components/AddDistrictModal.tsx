import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "next-i18next";
import { getUserDetailsInfo } from "@/services/UserList";
import { Storage } from "@/utils/app.constant";

interface AddDistrictBlockModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    value: string,
    controllingField: string,
    fieldId: string,
    districtId?: string
  ) => void;
  fieldId: string;
  initialValues?: {
    name?: string;
    value?: string;
    controllingField?: string;
  };
  districtId?: string;
}

const AddDistrictModal: React.FC<AddDistrictBlockModalProps> = ({
  open,
  onClose,
  onSubmit,
  fieldId,
  initialValues = {},
  districtId,
}) => {
  const [formData, setFormData] = useState({
    name: initialValues?.name ?? "",
    value: initialValues?.value ?? "",
    controllingField: initialValues?.controllingField ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [stateCode, setStateCode] = useState<string>("");
  const [stateValue, setStateValue] = useState<string>("");

  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserDetail = async () => {
      let userId: any;
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          userId = localStorage.getItem(Storage.USER_ID);
        }
        const response = await getUserDetailsInfo(userId);
        console.log("profile api is triggered", response.userData.customFields);

        const statesField = response.userData.customFields.find(
          (field: { label: string }) => field.label === "STATES"
        );

        if (statesField) {
          setStateValue(statesField.value);
          setStateCode(statesField.code);
          setFormData((prev) => ({
            ...prev,
            controllingField: statesField.code,
          }));
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (open) {
      fetchUserDetail();
    }
  }, [open]);

  useEffect(() => {
    setFormData({
      name: initialValues.name ?? "",
      value: initialValues.value ?? "",
      controllingField: initialValues.controllingField ?? stateCode,
    });
    setErrors({});
  }, [initialValues, stateCode]);

  const isValidName = (input: string) =>
    /^[a-zA-Z]+(?:\s[a-zA-Z]+)*$/.test(input);

  const isValidCode = (input: string) => /^[A-Z]{1,3}$/.test(input);

  const handleChange = (field: string, value: string) => {
    if (field === "name") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

    if (field === "value" && value.length > 3) {
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (value === "") {
      setErrors((prev) => ({
        ...prev,
        [field]: t(
          field === "name"
            ? "COMMON.DISTRICT_NAME_REQUIRED"
            : field === "controllingField"
              ? "COMMON.STATE_NAME_REQUIRED"
              : "COMMON.CODE_REQUIRED"
        ),
      }));
    } else if (field === "name" && !isValidName(value.trim())) {
      setErrors((prev) => ({ ...prev, [field]: t("COMMON.INVALID_INPUT") }));
    } else if (field === "value" && !isValidCode(value)) {
      setErrors((prev) => ({ ...prev, [field]: t("COMMON.INVALID_TEXT") }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; value?: string } = {};

    if (!formData.name) {
      newErrors.name = t("COMMON.STATE_NAME_REQUIRED");
    } else if (!isValidName(formData.name.trim())) {
      newErrors.name = t("COMMON.INVALID_TEXT");
    }

    if (!formData.value) {
      newErrors.value = t("COMMON.CODE_REQUIRED");
    } else if (!isValidCode(formData.value)) {
      newErrors.value = t("COMMON.INVALID_TEXT");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(
        formData.name,
        formData.value,
        formData.controllingField || stateCode,
        fieldId,
        districtId
      );
      setFormData({
        name: "",
        value: "",
        controllingField: "",
      });
      onClose();
    }
  };

  const isEditing = !!initialValues.name;
  const isEditCode = !!initialValues.value;
  const buttonText = isEditing ? t("COMMON.UPDATE") : t("COMMON.SUBMIT");
  const dialogTitle = isEditing
    ? t("COMMON.UPDATE_DISTRICT")
    : t("COMMON.ADD_DISTRICT");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ fontSize: "14px" }}>{dialogTitle}</DialogTitle>
      <Divider />
      <DialogContent>
        <Select
          value={formData.controllingField || stateCode}
          onChange={(e) => handleChange("controllingField", e.target.value)}
          fullWidth
          displayEmpty
          variant="outlined"
          margin="dense"
          error={!!errors.controllingField}
          disabled
        >
          <MenuItem key={stateCode} value={stateCode}>
            {stateValue}
          </MenuItem>
        </Select>
        {errors.controllingField && (
          <Typography variant="caption" color="error">
            {errors.controllingField}
          </Typography>
        )}
        <TextField
          margin="dense"
          label={t("COMMON.DISTRICT_NAME")}
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          margin="dense"
          label={t("COMMON.DISTRICT_CODE")}
          type="text"
          fullWidth
          variant="outlined"
          value={formData.value}
          onChange={(e) => handleChange("value", e.target.value.toUpperCase())}
          error={!!errors.value}
          helperText={errors.value}
          disabled={isEditCode}
        />
        <Box display="flex" alignItems="center" mt={2}>
          <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="caption" color="textSecondary">
            {t("COMMON.CODE_NOTIFICATION")}
          </Typography>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            border: "none",
            color: "secondary",
            fontSize: "14px",
            fontWeight: "500",
            "&:hover": {
              border: "none",
              backgroundColor: "transparent",
            },
          }}
          variant="outlined"
        >
          {t("COMMON.CANCEL")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ fontSize: "14px" }}
          color="primary"
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDistrictModal;
