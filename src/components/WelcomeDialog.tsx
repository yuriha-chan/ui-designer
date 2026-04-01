import React from "react";
import {
  Dialog,
  Portal,
  Heading,
  Text,
  VStack,
  Button,
  HStack,
  Link,
} from "@chakra-ui/react";
import { useI18n, type Language } from "../I18nContext";

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

const DOC_BASE_PATH = "/docs";

function getDocLinks(lang: Language) {
  const base = lang === "ja" ? DOC_BASE_PATH : `${DOC_BASE_PATH}/${lang}`;
  return {
    tutorial: `${base}/Tutorial`,
    userGuide: `${base}/User_Guide`,
  };
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  open,
  onClose,
}) => {
  const { t, language } = useI18n();
  const links = getDocLinks(language);

  return (
    <Portal>
      <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content padding="6">
            <Dialog.Header paddingBottom="4">
              <Heading size="lg">{t("welcome.title")}</Heading>
            </Dialog.Header>
            <Dialog.Body paddingBottom="6">
              <VStack align="start" gap="4">
                <Text fontSize="md" color="gray.300">
                  {t("welcome.description")}
                </Text>
                <HStack gap="4">
                  <Link
                    href={links.tutorial}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button colorScheme="blue" size="sm">
                      {t("welcome.tutorial")}
                    </Button>
                  </Link>
                  <Link
                    href={links.userGuide}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button colorScheme="teal" size="sm">
                      {t("welcome.userGuide")}
                    </Button>
                  </Link>
                </HStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer paddingTop="4">
              <Button onClick={onClose} colorScheme="blue">
                {t("welcome.close")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Portal>
  );
};
