import DynamicForm from "@/components/DynamicForm";
import {
  GenerateSchemaAndUiSchema,
  customFields,
} from "@/components/GeneratedSchemas";
import SimpleModal from "@/components/SimpleModal";
import { getFormRead } from "@/services/CreateUserService";
import { CohortTypes, FormContextType } from "@/utils/app.constant";
import { useLocationState } from "@/utils/useLocationState";
import { Box, Button, Typography } from "@mui/material";
import { IChangeEvent } from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { transformArray } from "../utils/Helper";
import AreaSelection from "./AreaSelection";
import { showToastMessage } from "./Toastify";
import { createCohort } from "@/services/CohortService/cohortService";
import useSubmittedButtonStore from "@/utils/useSharedState";

interface CustomField {
  fieldId: string;
  value: string[];
}

interface CohortDetails {
  name?: string;
  type?: string;
  parentId?: string | null;
  customFields?: CustomField[];
}
interface AddLearnerModalProps {
  open: boolean;
  onClose: () => void;
  formData?: object;
  isEditModal?: boolean;
  userId?: string;
}
interface FieldProp {
  value: string;
  label: string;
}
const AddNewCenters: React.FC<AddLearnerModalProps> = ({
  open,
  onClose,
  formData,
  isEditModal = false,
  userId,
}) => {
  const [schema, setSchema] = React.useState<any>();
  const [uiSchema, setUiSchema] = React.useState<any>();
  const [openAddNewCohort, setOpenAddNewCohort] =
    React.useState<boolean>(false);

  const { t } = useTranslation();
  const roleType = FormContextType.ADMIN_CENTER;
  const {
    states,
    districts,
    blocks,
    allCenters,
    isMobile,
    isMediumScreen,
    selectedState,
    selectedDistrict,
    selectedCenter,
    selectedBlock,
    blockFieldId,
    districtFieldId,
    stateFieldId,
    handleStateChangeWrapper,
    handleDistrictChangeWrapper,
    handleBlockChangeWrapper,
    handleCenterChangeWrapper,
    selectedBlockCohortId,
    selectedDistrictCode,
    selectedStateCode,
    selectedBlockCode,
    dynamicFormForBlock,
  } = useLocationState(open, onClose, roleType);
  const setSubmittedButtonStatus = useSubmittedButtonStore(
    (state: any) => state.setSubmittedButtonStatus
  );
  const [stateDefaultValueForCenter, setStateDefaultValueForCenter] = useState<string>("");

  useEffect(() => { 
    const getAddLearnerFormData = async () => {


      const admin = localStorage.getItem("adminInfo");
          if(admin)
          {
            const stateField = JSON.parse(admin).customFields.find((field: any) => field.label === "STATES");
              if (!stateField.value.includes(',')) {
                setStateDefaultValueForCenter(stateField.value)
              }
              else{
                setStateDefaultValueForCenter(t("COMMON.ALL_STATES"))

              }
          }
      try {
        const response = await getFormRead("cohorts", "cohort");
        console.log("sortedFields", response);

        if (response) {
          const { schema, uiSchema } = GenerateSchemaAndUiSchema(response, t);
          console.log("schema", schema);
          console.log("uiSchema", uiSchema);
          setSchema(schema);
          setUiSchema(uiSchema);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };
    getAddLearnerFormData();
  }, []);

  const handleSubmit = async (
    data: IChangeEvent<any, RJSFSchema, any>,
    event: React.FormEvent<any>
  ) => {
    const formData = data?.formData;
    console.log("selectedBlockCohortId", selectedBlockCohortId);

    if (selectedBlockCohortId) {
      const parentId = selectedBlockCohortId;
      const cohortDetails: CohortDetails = {
        name: formData.name,
        type: CohortTypes.COHORT,
        parentId: parentId,
        customFields: [
          {
            fieldId: stateFieldId,
            value: [selectedStateCode],
          },
          {
            fieldId: districtFieldId,
            value: [selectedDistrictCode],
          },
          {
            fieldId: blockFieldId,
            value: [selectedBlockCode],
          },
        ],
      };

      Object.entries(formData).forEach(([fieldKey, fieldValue]) => {
        const fieldSchema = schema.properties[fieldKey];
        const fieldId = fieldSchema?.fieldId;

        if (fieldId !== null) {
          cohortDetails?.customFields?.push({
            fieldId: fieldId,
            value: formData.cohort_type,
          });
        }
      });
      if (
        cohortDetails?.customFields &&
        cohortDetails?.customFields?.length > 0 &&
        cohortDetails?.name
      ) {
        const cohortData = await createCohort(cohortDetails);
        if (cohortData) {
          showToastMessage(t("CENTERS.CENTER_CREATED_SUCCESSFULLY"), "success");
          setOpenAddNewCohort(false);
          onClose();
        }
      } else {
        showToastMessage("Please Input Data", "warning");
      }
    } else {
      showToastMessage(t("CENTER.NOT_ABLE_CREATE_CENTER"), "error");
    }
  };

  const handleChangeForm = (event: IChangeEvent<any>) => {
    console.log("Form data changed:", event.formData);
  };

  const handleError = () => {
    console.log("error");
  };

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      showFooter={false}
      modalTitle={t("CENTERS.NEW_CENTER")}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "10px",
        }}
      >
        <AreaSelection
          states={transformArray(states)}
          districts={transformArray(districts)}
          blocks={transformArray(blocks)}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
          handleStateChangeWrapper={handleStateChangeWrapper}
          handleDistrictChangeWrapper={handleDistrictChangeWrapper}
          handleBlockChangeWrapper={handleBlockChangeWrapper}
          isMobile={isMobile}
          isMediumScreen={isMediumScreen}
          isCenterSelection={false}
          allCenters={allCenters}
          selectedCenter={selectedCenter}
          handleCenterChangeWrapper={handleCenterChangeWrapper}
          inModal={true}
          stateDefaultValue={stateDefaultValueForCenter}
        />
      </Box>
      {dynamicFormForBlock && schema && uiSchema && selectedBlockCohortId && (
        <DynamicForm
          schema={schema}
          uiSchema={uiSchema}
          onSubmit={handleSubmit}
          onChange={handleChangeForm}
          onError={handleError}
          widgets={{}}
          showErrorList={true}
          customFields={customFields}
          id="new-center-form"
        >
          <Box
            style={{
              display: "flex",
              justifyContent: "right", // Centers the button horizontally
              marginTop: "20px", // Adjust margin as needed
            }}
            gap={2}
          >
            <Button
              variant="outlined"
              type="submit"
              form="new-center-form" // Add this line
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                width: "auto",
                height: "40px",
                marginLeft: "10px",
              }}
              onClick={onClose}
            >
              {t("COMMON.CANCEL")}
            </Button>
            <Button
              variant="contained"
              type="submit"
              form="new-center-form" // Add this line
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                width: "auto",
                height: "40px",
                marginLeft: "10px",
              }}
              onClick={() => {
                setSubmittedButtonStatus(true);
                console.log("Submit button was clicked");
              }}
            >
              {t("COMMON.CREATE")}
            </Button>
          </Box>
        </DynamicForm>
      )}
      {!selectedBlockCohortId && selectedBlockCohortId !== "" && (
        <Box mt={3} textAlign={"center"}>
          <Typography color={"error"}>
            {t("COMMON.SOMETHING_WENT_WRONG")}
          </Typography>
        </Box>
      )}
    </SimpleModal>
  );
};

export default AddNewCenters;
