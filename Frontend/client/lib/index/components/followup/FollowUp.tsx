import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FollowUpRecords } from "./FollowUpRecords";
import { FollowUpDetails } from "./FollowUpDetails";
import { FollowUpNewVisit } from "./FollowUpNewVisit";

/**
 * Follow-up module router.
 *   /followup                     → records search page (results table only)
 *   /followup/:registrationId     → Follow-up Details page (read-only)
 *   /followup/:registrationId/new → dedicated New Follow-up page (create form)
 * Clicking an HBCR Registration Number opens the details page; clicking
 * "+ Add New Follow-up" there opens the separate create page.
 */
export function FollowUp() {
  const { registrationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname.endsWith("/new");

  if (registrationId) {
    const id = Number(registrationId);
    if (Number.isInteger(id) && id > 0) {
      if (isNew) {
        return (
          <FollowUpNewVisit
            registrationId={id}
            onDone={() => navigate(`/followup/${id}`)}
          />
        );
      }
      return (
        <FollowUpDetails
          registrationId={id}
          onBack={() => navigate("/followup")}
          onAddNew={() => navigate(`/followup/${id}/new`)}
        />
      );
    }
    // Malformed id — fall through to the search page.
  }

  return (
    <FollowUpRecords onSelect={(id) => navigate(`/followup/${id}`)} />
  );
}
