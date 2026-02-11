import QuoteResponseBadge from "@/components/QuoteResponseBadge";
import { ProfileColorHexMap } from "@/constants/Colors";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getStyles as getFeedQuoteStyles } from "@/components/FeedQuote";
import { getPastelFromId } from "@/lib/utils/style";
import { Quote } from "@/types/api";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface HiddenQuoteProps {
  quote: Quote;
  theme: any;
  onUnhide: (quoteId: number) => void;
}

const HiddenQuote: React.FC<HiddenQuoteProps> = ({ quote, theme, onUnhide }) => {
  const styles = useThemedStyles(getFeedQuoteStyles);
  const router = useRouter();

  const randomPastel = getPastelFromId(quote.id, theme);
  const profileColor = quote.quoted_user
    ? ProfileColorHexMap[quote.quoted_user.profile_color]
    : null;
  const gradientColors: [string, string] = [
    randomPastel,
    profileColor ?? randomPastel,
  ];

  const navigateToProfile = (userId: number) => {
    router.push({
      pathname: "/user/[userID]",
      params: { userID: String(userId) },
    });
  };

  return (
    <View style={styles.quoteContainer}>
      {/* Gradient left strip */}
      <View style={styles.gradientStrip}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
      </View>

      {/* Header: "X quoted Y" with simple Unhide control (no menus/actions) */}
      <View style={styles.header}>
        <View style={styles.headerNames}>
          <TouchableOpacity onPress={() => navigateToProfile(quote.author.id)}>
            <Text style={styles.authorName}>{quote.author.display_name}</Text>
          </TouchableOpacity>

          <Text style={styles.headerText}> quoted </Text>

          {quote.quoted_user ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => navigateToProfile(quote.quoted_user!.id)}
              >
                <Text style={styles.quotedNameLink}>
                  {quote.quoted_user.display_name}
                </Text>
              </TouchableOpacity>
              {quote.quoted_user_response && (
                <QuoteResponseBadge
                  response={quote.quoted_user_response}
                  compact
                />
              )}
            </View>
          ) : (
            <Text style={styles.externalName}>{quote.quoted_name}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onUnhide(quote.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.undoLink}>Unhide</Text>
        </TouchableOpacity>
      </View>

      {/* Optional context */}
      {quote.context ? (
        <Text style={[styles.contextText, { color: randomPastel }]}>
          {quote.context}
        </Text>
      ) : null}

      {/* Quote Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.quoteContent}>&ldquo;{quote.text}&rdquo;</Text>
      </View>
    </View>
  );
};

export default HiddenQuote;

